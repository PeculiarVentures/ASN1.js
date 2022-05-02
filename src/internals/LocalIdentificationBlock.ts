import { BufferSourceConverter } from "pvtsutils";
import * as pvutils from "pvutils";
import { HexBlockJson, HexBlockParams, HexBlock } from "../HexBlock";
import { EMPTY_BUFFER, EMPTY_VIEW } from "./constants";
import { LocalBaseBlock, LocalBaseBlockJson } from "./LocalBaseBlock";
import { checkBufferParams } from "./utils";


export interface ILocalIdentificationBlock {
  tagClass: number;
  tagNumber: number;
  isConstructed: boolean;
}

export interface LocalIdentificationBlockParams {
  idBlock?: Partial<ILocalIdentificationBlock> & HexBlockParams;
}

export interface LocalIdentificationBlockJson extends HexBlockJson, LocalBaseBlockJson, ILocalIdentificationBlock { }


export class LocalIdentificationBlock extends HexBlock(LocalBaseBlock) implements ILocalIdentificationBlock {

  public static override NAME = "identificationBlock";

  public tagClass: number;
  public tagNumber: number;
  public isConstructed: boolean;

  constructor({
    idBlock = {},
  }: LocalIdentificationBlockParams = {}) {
    super();

    if (idBlock) {
      //#region Properties from hexBlock class
      this.isHexOnly = idBlock.isHexOnly ?? false;
      this.valueView = idBlock.valueHex ? BufferSourceConverter.toUint8Array(idBlock.valueHex) : EMPTY_VIEW;
      //#endregion
      this.tagClass = idBlock.tagClass ?? -1;
      this.tagNumber = idBlock.tagNumber ?? -1;
      this.isConstructed = idBlock.isConstructed ?? false;
    } else {
      this.tagClass = -1;
      this.tagNumber = -1;
      this.isConstructed = false;
    }
  }

  public override toBER(sizeOnly = false): ArrayBuffer {
    //#region Initial variables
    let firstOctet = 0;
    let retBuf: ArrayBuffer;
    let retView: Uint8Array;
    //#endregion
    switch (this.tagClass) {
      case 1:
        firstOctet |= 0x00; // UNIVERSAL
        break;
      case 2:
        firstOctet |= 0x40; // APPLICATION
        break;
      case 3:
        firstOctet |= 0x80; // CONTEXT-SPECIFIC
        break;
      case 4:
        firstOctet |= 0xC0; // PRIVATE
        break;
      default:
        this.error = "Unknown tag class";

        return (EMPTY_BUFFER);
    }

    if (this.isConstructed)
      firstOctet |= 0x20;

    if ((this.tagNumber < 31) && (!this.isHexOnly)) {
      retBuf = new ArrayBuffer(1);
      retView = new Uint8Array(retBuf);

      if (!sizeOnly) {
        let number = this.tagNumber;
        number &= 0x1F;
        firstOctet |= number;

        retView[0] = firstOctet;
      }

      return retBuf;
    }

    if (this.isHexOnly === false) {
      const encodedBuf = pvutils.utilToBase(this.tagNumber, 7);
      const encodedView = new Uint8Array(encodedBuf);
      const size = encodedBuf.byteLength;

      retBuf = new ArrayBuffer(size + 1);
      retView = new Uint8Array(retBuf);
      retView[0] = (firstOctet | 0x1F);

      if (!sizeOnly) {
        for (let i = 0; i < (size - 1); i++)
          retView[i + 1] = encodedView[i] | 0x80;

        retView[size] = encodedView[size - 1];
      }

      return retBuf;
    }

    retBuf = new ArrayBuffer(this.valueHex.byteLength + 1);
    retView = new Uint8Array(retBuf);

    retView[0] = (firstOctet | 0x1F);

    if (sizeOnly === false) {
      const curView = new Uint8Array(this.valueHex);

      for (let i = 0; i < (curView.length - 1); i++)
        retView[i + 1] = curView[i] | 0x80;

      retView[this.valueHex.byteLength] = curView[curView.length - 1];
    }

    return retBuf;
  }

  public override fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
    const inputView = BufferSourceConverter.toUint8Array(inputBuffer);

    // Basic check for parameters
    if (!checkBufferParams(this, inputView, inputOffset, inputLength)) {
      return -1;
    }

    // Getting Uint8Array from ArrayBuffer
    const intBuffer = inputView.subarray(inputOffset, inputOffset + inputLength);

    //#region Initial checks
    if (intBuffer.length === 0) {
      this.error = "Zero buffer length";

      return -1;
    }
    //#endregion
    //#region Find tag class
    const tagClassMask = intBuffer[0] & 0xC0;

    switch (tagClassMask) {
      case 0x00:
        this.tagClass = (1); // UNIVERSAL
        break;
      case 0x40:
        this.tagClass = (2); // APPLICATION
        break;
      case 0x80:
        this.tagClass = (3); // CONTEXT-SPECIFIC
        break;
      case 0xC0:
        this.tagClass = (4); // PRIVATE
        break;
      default:
        this.error = "Unknown tag class";

        return -1;
    }
    //#endregion
    //#region Find it's constructed or not
    this.isConstructed = (intBuffer[0] & 0x20) === 0x20;
    //#endregion
    //#region Find tag number
    this.isHexOnly = false;

    const tagNumberMask = intBuffer[0] & 0x1F;

    //#region Simple case (tag number < 31)
    if (tagNumberMask !== 0x1F) {
      this.tagNumber = (tagNumberMask);
      this.blockLength = 1;
    }
    //#endregion

    //#region Tag number bigger or equal to 31
    else {
      let count = 1;

      let intTagNumberBuffer = this.valueView = new Uint8Array(255);
      let tagNumberBufferMaxLength = 255;

      while (intBuffer[count] & 0x80) {
        intTagNumberBuffer[count - 1] = intBuffer[count] & 0x7F;
        count++;

        if (count >= intBuffer.length) {
          this.error = "End of input reached before message was fully decoded";

          return -1;
        }

        //#region In case if tag number length is greater than 255 bytes (rare but possible case)
        if (count === tagNumberBufferMaxLength) {
          tagNumberBufferMaxLength += 255;

          const tempBuffer = new ArrayBuffer(tagNumberBufferMaxLength);
          const tempBufferView = new Uint8Array(tempBuffer);

          for (let i = 0; i < intTagNumberBuffer.length; i++)
            tempBufferView[i] = intTagNumberBuffer[i];

          intTagNumberBuffer = this.valueView = new Uint8Array(tagNumberBufferMaxLength);
        }
        //#endregion
      }

      this.blockLength = (count + 1);
      intTagNumberBuffer[count - 1] = intBuffer[count] & 0x7F; // Write last byte to buffer


      //#region Cut buffer
      const tempBufferView = new Uint8Array(count);

      for (let i = 0; i < count; i++)
        tempBufferView[i] = intTagNumberBuffer[i];

      intTagNumberBuffer = this.valueView = new Uint8Array(count);
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
    };
  }
}
