/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as pvtsutils from "pvtsutils";
import * as pvutils from "pvutils";
import { HexBlockJson, HexBlockParams, HexBlock } from "../HexBlock";
import { ETagClass, EUniversalTagNumber } from "../TypeStore";
import { EMPTY_BUFFER, EMPTY_VIEW } from "./constants";
import { LocalBaseBlock, LocalBaseBlockJson } from "./LocalBaseBlock";
import { checkBufferParams } from "./utils";


export interface IBaseIDs {
  // The class of the asn1 object
  tagClass: ETagClass;
  // The tag number inside the class for the asn1 object
  tagNumber: EUniversalTagNumber;
}


export interface ILocalIdentificationBlock extends IBaseIDs {
  // True if this is a constructed object
  isConstructed: boolean;
  /**
   * In case a property is transported optionally the property may contain an id to specify it among a list of optionals
   * If this property is set (>=0) the encoder will encode the tagClass to 3 (CONTEXT-SPECIFIC) and set the tagNumber to the optionalID
   * While decoding the property is initally a primitive and then while mapping it to a scheme the tagClass and tagNumber are taken from the scheme
   * and the object recreated with the propertytype of the scheme (check optionals.spec.ts how its meant to be used)
   */
  optionalID: number;
}

export interface ILocalIdentificationBlockParams {
  idBlock?: Partial<ILocalIdentificationBlock> & HexBlockParams;
}

export interface LocalIdentificationBlockJson extends HexBlockJson, LocalBaseBlockJson, ILocalIdentificationBlock { }


export class LocalIdentificationBlock extends HexBlock(LocalBaseBlock) implements ILocalIdentificationBlock {

  public static override NAME = "identificationBlock";

  public tagClass: ETagClass;
  public tagNumber: EUniversalTagNumber | number;
  public isConstructed: boolean;
  public optionalID: number;

  constructor({
    idBlock = {},
  }: ILocalIdentificationBlockParams = {}) {
    super();

    if (idBlock) {
      //#region Properties from hexBlock class
      this.isHexOnly = idBlock.isHexOnly ?? false;
      this.valueHexView = idBlock.valueHex ? pvtsutils.BufferSourceConverter.toUint8Array(idBlock.valueHex) : EMPTY_VIEW;
      //#endregion
      this.tagClass = idBlock.tagClass ?? -1;
      this.tagNumber = idBlock.tagNumber ?? -1;
      this.isConstructed = idBlock.isConstructed ?? false;
      this.optionalID = idBlock.optionalID ?? -1;
    } else {
      this.tagClass = -1;
      this.tagNumber = -1;
      this.isConstructed = false;
      this.optionalID = -1;
    }
  }

  /**
   * Encodes the localID block into ber
   *
   * @param sizeOnly - Do only provide the buffer (and with it the size) required to encode the inputData
   * @param ignoreOptionalID - calculate the idBlock and ignore the optionalID flag if provided (this is needed when we map back the optional attribute into the original parameter, the mapped idBlock contains the optionaID for reference but should not have an effect on the size calculation)
   */
  public override toBER(sizeOnly = false, ignoreOptionalID = false): ArrayBuffer {
    let firstOctet = 0;

    let tagClass = this.tagClass;
    let tagNumber = this.tagNumber;
    if (this.optionalID >= 0 && !ignoreOptionalID) {
      tagClass = ETagClass.CONTEXT_SPECIFIC;
      tagNumber = this.optionalID;
    }

    switch (tagClass) {
      case ETagClass.UNIVERSAL:
        firstOctet |= 0x00; // UNIVERSAL
        break;
      case ETagClass.APPLICATION:
        firstOctet |= 0x40; // APPLICATION
        break;
      case ETagClass.CONTEXT_SPECIFIC:
        firstOctet |= 0x80; // CONTEXT-SPECIFIC
        break;
      case ETagClass.PRIVATE:
        firstOctet |= 0xC0; // PRIVATE
        break;
      default:
        this.error = "Unknown tag class";

        return EMPTY_BUFFER;
    }

    if (this.isConstructed)
      firstOctet |= 0x20;

    if (tagNumber < 31 && !this.isHexOnly) {
      const retView = new Uint8Array(1);

      if (!sizeOnly) {
        let number = tagNumber;
        number &= 0x1F;
        firstOctet |= number;
        retView[0] = firstOctet;
      }

      return retView.buffer;
    }

    if (!this.isHexOnly) {
      const encodedBuf = pvutils.utilToBase(tagNumber, 7);
      const encodedView = new Uint8Array(encodedBuf);
      const size = encodedBuf.byteLength;

      const retView = new Uint8Array(size + 1);
      retView[0] = (firstOctet | 0x1F);

      if (!sizeOnly) {
        for (let i = 0; i < (size - 1); i++)
          retView[i + 1] = encodedView[i] | 0x80;

        retView[size] = encodedView[size - 1];
      }

      return retView.buffer;
    }

    const retView = new Uint8Array(this.valueHexView.byteLength + 1);

    retView[0] = (firstOctet | 0x1F);

    if (!sizeOnly) {
      const curView = this.valueHexView;

      for (let i = 0; i < (curView.length - 1); i++)
        retView[i + 1] = curView[i] | 0x80;

      retView[this.valueHexView.byteLength] = curView[curView.length - 1];
    }

    return retView.buffer;
  }

  public override fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
    const inputView = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);

    // Basic check for parameters
    if (!checkBufferParams(this, inputView, inputOffset, inputLength)) {
      return -1;
    }

    // Getting Uint8Array from ArrayBuffer
    const intBuffer = inputView.subarray(inputOffset, inputOffset + inputLength);

    // Initial checks
    if (intBuffer.length === 0) {
      this.error = "Zero buffer length";

      return -1;
    }

    //#region Find tag class
    const tagClassMask = intBuffer[0] & 0xC0;

    switch (tagClassMask) {
      case 0x00:
        this.tagClass = ETagClass.UNIVERSAL; // UNIVERSAL
        break;
      case 0x40:
        this.tagClass = ETagClass.APPLICATION; // APPLICATION
        break;
      case 0x80:
        this.tagClass = ETagClass.CONTEXT_SPECIFIC; // CONTEXT-SPECIFIC
        break;
      case 0xC0:
        this.tagClass = ETagClass.PRIVATE; // PRIVATE
        break;
      default:
        this.error = "Unknown tag class";
        return -1;
    }
    //#endregion
    // Find it's constructed or not
    this.isConstructed = (intBuffer[0] & 0x20) === 0x20;

    // Find tag number
    this.isHexOnly = false;
    const tagNumberMask = intBuffer[0] & 0x1F;

    if (tagNumberMask !== 0x1F) {
      // Simple case (tag number < 31)
      this.tagNumber = (tagNumberMask);
      this.blockLength = 1;
    } else {
      // Tag number bigger or equal to 31
      let count = 1;

      let intTagNumberBuffer = this.valueHexView = new Uint8Array(255);
      let tagNumberBufferMaxLength = 255;

      while (intBuffer[count] & 0x80) {
        intTagNumberBuffer[count - 1] = intBuffer[count] & 0x7F;
        count++;

        if (count >= intBuffer.length) {
          this.error = "End of input reached before message was fully decoded";

          return -1;
        }

        // In case if tag number length is greater than 255 bytes (rare but possible case)
        if (count === tagNumberBufferMaxLength) {
          tagNumberBufferMaxLength += 255;

          const tempBufferView = new Uint8Array(tagNumberBufferMaxLength);

          for (let i = 0; i < intTagNumberBuffer.length; i++)
            tempBufferView[i] = intTagNumberBuffer[i];

          intTagNumberBuffer = this.valueHexView = new Uint8Array(tagNumberBufferMaxLength);
        }
      }

      this.blockLength = (count + 1);
      intTagNumberBuffer[count - 1] = intBuffer[count] & 0x7F; // Write last byte to buffer


      //#region Cut buffer
      const tempBufferView = new Uint8Array(count);

      for (let i = 0; i < count; i++)
        tempBufferView[i] = intTagNumberBuffer[i];

      intTagNumberBuffer = this.valueHexView = new Uint8Array(count);
      intTagNumberBuffer.set(tempBufferView);
      //#endregion
      //#region Try to convert long tag number to short form
      if (this.blockLength <= 9)
        this.tagNumber = pvutils.utilFromBase(intTagNumberBuffer, 7);
      else {
        this.isHexOnly = true;
        this.warnings.push("Tag too long, represented as hex-coded");
      }
      //#endregion
    }
    //#endregion
    //#endregion
    //#region Check if constructed encoding was using for primitive type
    if (((this.tagClass === 1)) &&
      (this.isConstructed)) {
      switch (this.tagNumber) {
        case 1: // Boolean
        case 2: // REAL
        case 5: // Null
        case 6: // OBJECT IDENTIFIER
        case 9: // REAL
        case 13: // RELATIVE OBJECT IDENTIFIER
        case 14: // Time
        case 23:
        case 24:
        case 31:
        case 32:
        case 33:
        case 34:
          this.error = "Constructed encoding used for primitive type";

          return -1;
        default:
      }
    }
    //#endregion

    return (inputOffset + this.blockLength); // Return current offset in input buffer
  }

  public override toJSON(): LocalIdentificationBlockJson {
    return {
      ...super.toJSON(),
      tagClass: this.tagClass,
      tagNumber: this.tagNumber,
      isConstructed: this.isConstructed,
      optionalID: this.optionalID
    };
  }

  /**
   * Checks whether two LocalIdentificationBlock are of the same type
   *
   * @param other - the object to compare against
   * @returns true in case other and this is from the same type
   */
  public isIdenticalType(other: IBaseIDs): boolean {
    return this.tagClass === other.tagClass && this.tagNumber === other.tagNumber;
  }
}

export interface LocalIdentificationBlock {
  /**
   * @deprecated since version 3.0.0
   */
  // @ts-ignore
  valueBeforeDecode: ArrayBuffer;
  /**
   * Binary data in ArrayBuffer representation
   *
   * @deprecated since version 3.0.0
   */
  // @ts-ignore
  valueHex: ArrayBuffer;
}