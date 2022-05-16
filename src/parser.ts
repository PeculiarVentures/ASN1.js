import * as pvtsutils from "pvtsutils";
import { ValueBlock } from "./ValueBlock";
import { BaseBlock } from "./BaseBlock";
import { LocalBaseBlock } from "./internals/LocalBaseBlock";
import { AsnType, typeStore } from "./TypeStore";
import { checkBufferParams } from "./internals/utils";

export interface FromBerResult {
  offset: number;
  result: AsnType;
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
export function localFromBER(inputBuffer: Uint8Array, inputOffset = 0, inputLength = inputBuffer.length): FromBerResult {
  const incomingOffset = inputOffset; // Need to store initial offset since "inputOffset" is changing in the function

  // Create a basic ASN.1 type since we need to return errors and warnings from the function
  let returnObject = new BaseBlock({}, ValueBlock);

  // Basic check for parameters
  const baseBlock = new LocalBaseBlock();
  if (!checkBufferParams(baseBlock, inputBuffer, inputOffset, inputLength)) {
    returnObject.error = baseBlock.error;

    return {
      offset: -1,
      result: returnObject
    };
  }

  // Getting Uint8Array subarray
  const intBuffer = inputBuffer.subarray(inputOffset, inputOffset + inputLength);

  // Initial checks
  if (!intBuffer.length) {
    returnObject.error = "Zero buffer length";

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

  // Check for using indefinite length form in encoding for primitive types
  if (!returnObject.idBlock.isConstructed &&
    returnObject.lenBlock.isIndefiniteForm) {
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
      if ((returnObject.idBlock.tagNumber >= 37) &&
        (returnObject.idBlock.isHexOnly === false)) {
        returnObject.error = "UNIVERSAL 37 and upper tags are reserved by ASN.1 standard";

        return {
          offset: -1,
          result: returnObject
        };
      }
      switch (returnObject.idBlock.tagNumber) {
        case 0: // EndOfContent
          // Check for EndOfContent type
          if ((returnObject.idBlock.isConstructed) &&
            (returnObject.lenBlock.length > 0)) {
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
      newASN1Type = returnObject.idBlock.isConstructed
        ? typeStore.Constructed
        : typeStore.Primitive;
    }
  }


  // Change type and perform BER decoding
  returnObject = localChangeType(returnObject, newASN1Type);
  // console.time("valueBlock");
  resultOffset = returnObject.fromBER(inputBuffer, inputOffset, returnObject.lenBlock.isIndefiniteForm ? inputLength : returnObject.lenBlock.length);

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
 */
export function fromBER(inputBuffer: pvtsutils.BufferSource): FromBerResult {
  if (!inputBuffer.byteLength) {
    const result = new BaseBlock({}, ValueBlock);
    result.error = "Input buffer has zero length";

    return {
      offset: -1,
      result
    };
  }

  return localFromBER(pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer).slice(), 0, inputBuffer.byteLength);
}
