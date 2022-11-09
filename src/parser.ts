import * as pvtsutils from "pvtsutils";
import { ValueBlock } from "./ValueBlock";
import { BaseBlock } from "./BaseBlock";
import { LocalBaseBlock } from "./internals/LocalBaseBlock";
import { AsnType, ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";
import { checkBufferParams } from "./internals/utils";
import { ILocalIdentificationBlock } from "./internals/LocalIdentificationBlock";
import { Constructed } from "./Constructed";
import { IHexBlock } from "./HexBlock";
import { Primitive } from "./Primitive";

export interface FromBerResult {
  offset: number;
  result: AsnType;
}
export type TnewAsnType = new () => AsnType;

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

export function getTypeForIDBlock(idBlock: ILocalIdentificationBlock & IHexBlock): TnewAsnType | undefined {
  if(idBlock.tagClass === 1) {
    switch (idBlock.tagNumber) {
      case EUniversalTagNumber.EndOfContent:
        return typeStore.EndOfContent;
      case EUniversalTagNumber.Boolean:
        return typeStore.Boolean;
      case EUniversalTagNumber.Integer:
        return typeStore.Integer;
      case EUniversalTagNumber.BitString:
        return typeStore.BitString;
      case EUniversalTagNumber.OctetString:
        return typeStore.OctetString;
      case EUniversalTagNumber.Null:
        return typeStore.Null;
      case EUniversalTagNumber.ObjectIdentifier:
        return typeStore.ObjectIdentifier;
      case EUniversalTagNumber.Real:
        return typeStore.Real;
      case EUniversalTagNumber.Enumerated:
        return typeStore.Enumerated;
      case EUniversalTagNumber.Utf8String:
        return typeStore.Utf8String;
      case EUniversalTagNumber.RelativeObjectIdentifier:
        return typeStore.RelativeObjectIdentifier;
      case EUniversalTagNumber.TIME:
        return typeStore.TIME;
      case EUniversalTagNumber.Sequence:
        return typeStore.Sequence;
      case EUniversalTagNumber.Set:
        return typeStore.Set;
      case EUniversalTagNumber.NumericString:
        return typeStore.NumericString;
      case EUniversalTagNumber.PrintableString:
        return typeStore.PrintableString;
      case EUniversalTagNumber.TeletexString:
        return typeStore.TeletexString;
      case EUniversalTagNumber.VideotexString:
        return typeStore.VideotexString;
      case EUniversalTagNumber.IA5String:
        return typeStore.IA5String;
      case EUniversalTagNumber.UTCTime:
        return typeStore.UTCTime;
      case EUniversalTagNumber.GeneralizedTime:
        return typeStore.GeneralizedTime;
      case EUniversalTagNumber.GraphicString:
        return typeStore.GraphicString;
      case EUniversalTagNumber.VisibleString:
        return typeStore.VisibleString;
      case EUniversalTagNumber.GeneralString:
        return typeStore.GeneralString;
      case EUniversalTagNumber.UniversalString:
        return typeStore.UniversalString;
      case EUniversalTagNumber.CharacterString:
        return typeStore.CharacterString;
      case EUniversalTagNumber.BmpString:
        return typeStore.BmpString;
      case EUniversalTagNumber.DATE:
        return typeStore.DATE;
      case EUniversalTagNumber.TimeOfDay:
        return typeStore.TimeOfDay;
      case EUniversalTagNumber.DateTime:
        return typeStore.DateTime;
      case EUniversalTagNumber.Duration:
        return typeStore.Duration;
      default:
        return undefined;
    }
  } else {
    // All other tag classes
    // APPLICATION
    // CONTEXT-SPECIFIC
    // PRIVATE
    return idBlock.isConstructed ? typeStore.Constructed : typeStore.Primitive;
  }
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

  if (returnObject.idBlock.tagClass === 1) {
    if (returnObject.idBlock.tagNumber === 0 && returnObject.idBlock.isConstructed && returnObject.lenBlock.length > 0) {
      returnObject.error = "Type [UNIVERSAL 0] is reserved";
      return {
        offset: -1,
        result: returnObject
      };
    } else if(returnObject.idBlock.tagNumber >= 37 && returnObject.idBlock.isHexOnly === false) {
      returnObject.error = "UNIVERSAL 37 and upper tags are reserved by ASN.1 standard";
      return {
        offset: -1,
        result: returnObject
      };
    }
  }

  const newASN1Type = getTypeForIDBlock(returnObject.idBlock);
  if (newASN1Type === undefined) {
    returnObject.error = `Unable to create property for tagClass:${returnObject.idBlock.tagClass} tagNumber:${returnObject.idBlock.tagNumber}`;
    return {
      offset: -1,
      result: returnObject
    };
  }
  if ((newASN1Type instanceof Constructed || newASN1Type instanceof Primitive) && returnObject.idBlock.tagClass === ETagClass.UNIVERSAL) {
      newASN1Type.idBlock = returnObject.idBlock;
      newASN1Type.lenBlock = returnObject.lenBlock;
      newASN1Type.warnings = returnObject.warnings;
      returnObject = newASN1Type as BaseBlock;
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
