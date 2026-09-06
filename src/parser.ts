import * as pvtsutils from "pvtsutils";
import { ValueBlock } from "./ValueBlock";
import { BaseBlock } from "./BaseBlock";
import { AsnType, typeStore } from "./TypeStore";
import { checkBufferParams } from "./internals/utils";
import { LocalIdentificationBlock, ORIGINAL_LOCAL_IDENTIFICATION_FROM_BER } from "./internals/LocalIdentificationBlock";
import { LocalLengthBlock, ORIGINAL_LOCAL_LENGTH_FROM_BER } from "./internals/LocalLengthBlock";
import type { Integer } from "./Integer";
import type { Null } from "./Null";
import type { Sequence } from "./Sequence";

export interface FromBerResult {
  offset: number;
  result: AsnType;
}

export interface FromBerOptions {
  maxDepth?: number;
  maxNodes?: number;
  maxContentLength?: number;
  parseEmbedded?: boolean;
  copyInput?: boolean;
}

export interface FromBerContext {
  depth: number;
  maxDepth: number;
  nodesCount: number;
  maxNodes: number;
  maxContentLength: number;
  parseEmbedded?: boolean;
}

interface FastParserRegistry {
  Integer: new () => AsnType;
  Null: new () => AsnType;
  Sequence: new () => AsnType;
}

interface FastParserConstructors {
  Integer: typeof Integer;
  Null: typeof Null;
  Sequence: typeof Sequence;
}

let fastParserRegistry: FastParserRegistry | undefined;

/** @internal */
export function registerFastParser(constructors: FastParserConstructors): void {
  fastParserRegistry = {
    Integer: constructors.Integer,
    Null: constructors.Null,
    Sequence: constructors.Sequence
  };
}

function fastParserContext(context: FromBerContext): boolean {
  const nodes = Object.getOwnPropertyDescriptor(context, "nodesCount");
  const maxNodes = Object.getOwnPropertyDescriptor(context, "maxNodes");
  const maxContentLength = Object.getOwnPropertyDescriptor(context, "maxContentLength");
  if (!nodes || !("value" in nodes) || nodes.writable !== true) return false;
  if (!maxNodes || !("value" in maxNodes) || !maxContentLength || !("value" in maxContentLength)) return false;

  return (
    typeof nodes.value === "number" &&
    Number.isSafeInteger(nodes.value) &&
    nodes.value >= 0 &&
    typeof maxNodes.value === "number" &&
    Number.isSafeInteger(maxNodes.value) &&
    maxNodes.value >= 0 &&
    typeof maxContentLength.value === "number" &&
    Number.isSafeInteger(maxContentLength.value) &&
    maxContentLength.value >= 0 &&
    nodes.value < maxNodes.value
  );
}

function fastParserType(
  store: typeof typeStore,
  name: "Integer" | "Null" | "Sequence",
  value: (new () => AsnType) | undefined
): boolean {
  const descriptor = Object.getOwnPropertyDescriptor(store, name);
  return !!descriptor && "value" in descriptor && descriptor.value === value;
}

function tryFastFromBER(
  inputBuffer: Uint8Array,
  inputOffset: number,
  inputLength: number,
  context: FromBerContext
): FromBerResult | undefined {
  const registry = fastParserRegistry;
  if (!registry) return undefined;

  let Constructor: (new () => AsnType) | undefined;
  let length = 0;
  try {
    if (Object.getPrototypeOf(inputBuffer) !== Uint8Array.prototype) return undefined;
    if (
      !Number.isSafeInteger(inputOffset) ||
      inputOffset < 0 ||
      !Number.isSafeInteger(inputLength) ||
      inputLength < 2
    ) {
      return undefined;
    }
    if (inputOffset > inputBuffer.byteLength || inputLength > inputBuffer.byteLength - inputOffset) return undefined;
    const tag = inputBuffer[inputOffset];
    if (tag !== 0x02 && tag !== 0x05 && tag !== 0x30) return undefined;
    length = inputBuffer[inputOffset + 1];
    if (length >= 0x80 || length > inputLength - 2) return undefined;
    if (tag === 0x05 && length !== 0) return undefined;
    if (!fastParserContext(context)) return undefined;
    if (length > (Object.getOwnPropertyDescriptor(context, "maxContentLength") as PropertyDescriptor).value) {
      return undefined;
    }

    const constructorName = tag === 0x02 ? "Integer" : tag === 0x05 ? "Null" : "Sequence";
    Constructor = registry[constructorName];
    if (!fastParserType(typeStore, constructorName, Constructor)) return undefined;

    const identificationFromBER = Object.getOwnPropertyDescriptor(LocalIdentificationBlock.prototype, "fromBER");
    const lengthFromBER = Object.getOwnPropertyDescriptor(LocalLengthBlock.prototype, "fromBER");
    if (
      !identificationFromBER ||
      !("value" in identificationFromBER) ||
      identificationFromBER.value !== ORIGINAL_LOCAL_IDENTIFICATION_FROM_BER ||
      !lengthFromBER ||
      !("value" in lengthFromBER) ||
      lengthFromBER.value !== ORIGINAL_LOCAL_LENGTH_FROM_BER
    )
      return undefined;
  } catch {
    return undefined;
  }

  if (!Constructor) return undefined;
  const result = new Constructor() as BaseBlock;
  result.idBlock.tagClass = 1;
  result.idBlock.tagNumber = (inputBuffer[inputOffset] as number) & 0x1f;
  result.idBlock.isConstructed = (inputBuffer[inputOffset] as number) === 0x30;
  result.idBlock.isHexOnly = false;
  result.idBlock.blockLength = 1;
  result.lenBlock.isIndefiniteForm = false;
  result.lenBlock.longFormUsed = false;
  result.lenBlock.length = length;
  result.lenBlock.blockLength = 1;
  context.nodesCount += 1;
  const resultOffset = result.fromBER(inputBuffer, inputOffset + 2, length, context);
  result.valueBeforeDecodeView = inputBuffer.subarray(inputOffset, inputOffset + result.blockLength);

  return { offset: resultOffset, result };
}

export const DEFAULT_MAX_DEPTH = 100;
export const DEFAULT_MAX_NODES = 10000;
export const DEFAULT_MAX_CONTENT_LENGTH = 16 * 1024 * 1024;

export const MAX_DEPTH_EXCEEDED_ERROR = "Maximum ASN.1 nesting depth exceeded";
export const MAX_NODES_EXCEEDED_ERROR = "Maximum ASN.1 node count exceeded";
export const MAX_CONTENT_LENGTH_EXCEEDED_ERROR = "Maximum ASN.1 content length exceeded";

export function createFromBerContext(options: FromBerOptions = {}): FromBerContext {
  return {
    depth: 0,
    maxDepth: options.maxDepth ?? DEFAULT_MAX_DEPTH,
    nodesCount: 0,
    maxNodes: options.maxNodes ?? DEFAULT_MAX_NODES,
    maxContentLength: options.maxContentLength ?? DEFAULT_MAX_CONTENT_LENGTH,
    parseEmbedded: options.parseEmbedded ?? true
  };
}

function createErrorResult(error: string): FromBerResult {
  const result = new BaseBlock({}, ValueBlock);
  result.error = error;

  return {
    offset: -1,
    result
  };
}

function checkNodesLimit(context: FromBerContext): string | undefined {
  context.nodesCount += 1;
  if (context.nodesCount > context.maxNodes) {
    return MAX_NODES_EXCEEDED_ERROR;
  }

  return undefined;
}

function checkContentLengthLimit(inputLength: number, context: FromBerContext): string | undefined {
  if (inputLength > context.maxContentLength) {
    return MAX_CONTENT_LENGTH_EXCEEDED_ERROR;
  }

  return undefined;
}

export function localFromBERWithChildContext(
  inputBuffer: Uint8Array,
  inputOffset: number,
  inputLength: number,
  context: FromBerContext
): FromBerResult {
  const childDepth = context.depth + 1;
  if (childDepth > context.maxDepth) {
    return createErrorResult(MAX_DEPTH_EXCEEDED_ERROR);
  }

  context.depth = childDepth;

  try {
    return localFromBER(inputBuffer, inputOffset, inputLength, context);
  } finally {
    context.depth -= 1;
  }
}

/**
 * Local function changing a type for ASN.1 classes
 * @param inputObject Incoming object
 * @param newType Target type to convert
 * @returns Converted object
 */
function localChangeType<T extends BaseBlock>(inputObject: BaseBlock, newType: new () => T): T {
  if (inputObject instanceof newType) {
    return inputObject;
  }

  const newObject = new newType();
  newObject.idBlock = inputObject.idBlock;
  newObject.lenBlock = inputObject.lenBlock;
  newObject.warnings = inputObject.warnings;
  newObject.valueBeforeDecodeView = inputObject.valueBeforeDecodeView;

  return newObject;
}

/**
 * Internal library function for decoding ASN.1 BER
 * @param inputBuffer ASN.1 BER encoded array
 * @param inputOffset Offset in ASN.1 BER encoded array where decoding should be started
 * @param inputLength Maximum length of array of bytes which can be using in this function
 * @returns
 */
export function localFromBER(
  inputBuffer: Uint8Array,
  inputOffset = 0,
  inputLength = inputBuffer.length,
  context: FromBerContext = createFromBerContext()
): FromBerResult {
  const fastResult = tryFastFromBER(inputBuffer, inputOffset, inputLength, context);
  if (fastResult) return fastResult;

  const incomingOffset = inputOffset; // Need to store initial offset since "inputOffset" is changing in the function

  // Create a basic ASN.1 type since we need to return errors and warnings from the function
  let returnObject = new BaseBlock({}, ValueBlock);

  // Basic check for parameters
  if (!checkBufferParams(returnObject, inputBuffer, inputOffset, inputLength)) {
    return {
      offset: -1,
      result: returnObject
    };
  }

  // Initial checks
  const fastArgs = Number.isInteger(inputOffset) && Number.isInteger(inputLength);
  if (fastArgs ? inputLength === 0 : inputBuffer.subarray(inputOffset, inputOffset + inputLength).length === 0) {
    returnObject.error = "Zero buffer length";

    return {
      offset: -1,
      result: returnObject
    };
  }

  const nodesLimitError = checkNodesLimit(context);
  if (nodesLimitError) {
    returnObject.error = nodesLimitError;

    return {
      offset: -1,
      result: returnObject
    };
  }

  // Decode identification block of ASN.1 BER structure
  // console.time("idBlock");
  let resultOffset = returnObject.idBlock.fromBER(inputBuffer, inputOffset, inputLength);
  if (returnObject.idBlock.warnings.length) {
    returnObject.warnings.concat(returnObject.idBlock.warnings);
  }
  if (resultOffset === -1) {
    returnObject.error = returnObject.idBlock.error;

    return {
      offset: -1,
      result: returnObject
    };
  }
  // console.timeEnd("idBlock");

  inputOffset = resultOffset;
  inputLength -= returnObject.idBlock.blockLength;

  // Decode length block of ASN.1 BER structure
  // console.time("lengthBlock");
  resultOffset = returnObject.lenBlock.fromBER(inputBuffer, inputOffset, inputLength);
  if (returnObject.lenBlock.warnings.length) {
    returnObject.warnings.concat(returnObject.lenBlock.warnings);
  }
  if (resultOffset === -1) {
    returnObject.error = returnObject.lenBlock.error;

    return {
      offset: -1,
      result: returnObject
    };
  }
  // console.timeEnd("lengthBlock");

  inputOffset = resultOffset;
  inputLength -= returnObject.lenBlock.blockLength;

  const valueLength = returnObject.lenBlock.isIndefiniteForm ? inputLength : returnObject.lenBlock.length;
  const contentLengthError = checkContentLengthLimit(valueLength, context);
  if (contentLengthError) {
    returnObject.error = contentLengthError;

    return {
      offset: -1,
      result: returnObject
    };
  }

  // Check for using indefinite length form in encoding for primitive types
  if (!returnObject.idBlock.isConstructed && returnObject.lenBlock.isIndefiniteForm) {
    returnObject.error = "Indefinite length form used for primitive encoding form";

    return {
      offset: -1,
      result: returnObject
    };
  }

  // Switch ASN.1 block type
  let newASN1Type: new () => AsnType = BaseBlock as any;

  switch (returnObject.idBlock.tagClass) {
    // UNIVERSAL
    case 1:
      // Check for reserved tag numbers
      if (returnObject.idBlock.tagNumber >= 37 && returnObject.idBlock.isHexOnly === false) {
        returnObject.error = "UNIVERSAL 37 and upper tags are reserved by ASN.1 standard";

        return {
          offset: -1,
          result: returnObject
        };
      }
      switch (returnObject.idBlock.tagNumber) {
        case 0: // EndOfContent
          // Check for EndOfContent type
          if (returnObject.idBlock.isConstructed && returnObject.lenBlock.length > 0) {
            returnObject.error = "Type [UNIVERSAL 0] is reserved";

            return {
              offset: -1,
              result: returnObject
            };
          }

          newASN1Type = typeStore.EndOfContent;

          break;
        case 1: // Boolean
          newASN1Type = typeStore.Boolean;
          break;
        case 2: // Integer
          newASN1Type = typeStore.Integer;
          break;
        case 3: // BitString
          newASN1Type = typeStore.BitString;
          break;
        case 4: // OctetString
          newASN1Type = typeStore.OctetString;
          break;
        case 5: // Null
          newASN1Type = typeStore.Null;
          break;
        case 6: // ObjectIdentifier
          newASN1Type = typeStore.ObjectIdentifier;
          break;
        case 10: // Enumerated
          newASN1Type = typeStore.Enumerated;
          break;
        case 12: // Utf8String
          newASN1Type = typeStore.Utf8String;
          break;
        case 13: // RelativeObjectIdentifier
          newASN1Type = typeStore.RelativeObjectIdentifier;
          break;
        case 14: // TIME
          newASN1Type = typeStore.TIME;
          break;
        case 15:
          returnObject.error = "[UNIVERSAL 15] is reserved by ASN.1 standard";

          return {
            offset: -1,
            result: returnObject
          };
        case 16: // Sequence
          newASN1Type = typeStore.Sequence;
          break;
        case 17: // Set
          newASN1Type = typeStore.Set;
          break;
        case 18: // NumericString
          newASN1Type = typeStore.NumericString;
          break;
        case 19: // PrintableString
          newASN1Type = typeStore.PrintableString;
          break;
        case 20: // TeletexString
          newASN1Type = typeStore.TeletexString;
          break;
        case 21: // VideotexString
          newASN1Type = typeStore.VideotexString;
          break;
        case 22: // IA5String
          newASN1Type = typeStore.IA5String;
          break;
        case 23: // UTCTime
          newASN1Type = typeStore.UTCTime;
          break;
        case 24: // GeneralizedTime
          newASN1Type = typeStore.GeneralizedTime;
          break;
        case 25: // GraphicString
          newASN1Type = typeStore.GraphicString;
          break;
        case 26: // VisibleString
          newASN1Type = typeStore.VisibleString;
          break;
        case 27: // GeneralString
          newASN1Type = typeStore.GeneralString;
          break;
        case 28: // UniversalString
          newASN1Type = typeStore.UniversalString;
          break;
        case 29: // CharacterString
          newASN1Type = typeStore.CharacterString;
          break;
        case 30: // BmpString
          newASN1Type = typeStore.BmpString;
          break;
        case 31: // DATE
          newASN1Type = typeStore.DATE;
          break;
        case 32: // TimeOfDay
          newASN1Type = typeStore.TimeOfDay;
          break;
        case 33: // DateTime
          newASN1Type = typeStore.DateTime;
          break;
        case 34: // Duration
          newASN1Type = typeStore.Duration;
          break;
        default: {
          const newObject = returnObject.idBlock.isConstructed
            ? new typeStore.Constructed()
            : new typeStore.Primitive();

          newObject.idBlock = returnObject.idBlock;
          newObject.lenBlock = returnObject.lenBlock;
          newObject.warnings = returnObject.warnings;

          returnObject = newObject;
        }
      }
      break;
    // All other tag classes
    case 2: // APPLICATION
    case 3: // CONTEXT-SPECIFIC
    case 4: // PRIVATE
    default: {
      newASN1Type = returnObject.idBlock.isConstructed ? typeStore.Constructed : typeStore.Primitive;
    }
  }

  // Change type and perform BER decoding
  returnObject = localChangeType(returnObject, newASN1Type);
  // console.time("valueBlock");
  resultOffset = returnObject.fromBER(inputBuffer, inputOffset, valueLength, context);

  // Coping incoming buffer for entire ASN.1 block
  returnObject.valueBeforeDecodeView = inputBuffer.subarray(incomingOffset, incomingOffset + returnObject.blockLength);
  // console.timeEnd("valueBlock");

  return {
    offset: resultOffset,
    result: returnObject
  };
}

/**
 * Major function for decoding ASN.1 BER array into internal library structures
 * @param inputBuffer ASN.1 BER encoded array of bytes
 * @param options Parser resource limits for untrusted input
 */
export function fromBER(inputBuffer: pvtsutils.BufferSource, options: FromBerOptions = {}): FromBerResult {
  if (!inputBuffer.byteLength) {
    const result = new BaseBlock({}, ValueBlock);
    result.error = "Input buffer has zero length";

    return {
      offset: -1,
      result
    };
  }

  const inputView = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);
  const normalizedInput = options.copyInput === false ? inputView : inputView.slice();

  return localFromBER(normalizedInput, 0, inputBuffer.byteLength, createFromBerContext(options));
}
