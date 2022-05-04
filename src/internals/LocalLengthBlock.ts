import * as pvtsutils from "pvtsutils";
import * as pvutils from "pvutils";
import { IBerConvertible } from "../types";
import { EMPTY_BUFFER } from "./constants";
import { LocalBaseBlock, LocalBaseBlockJson } from "./LocalBaseBlock";
import { checkBufferParams } from "./utils";

export interface ILocalLengthBlock {
  isIndefiniteForm: boolean;
  longFormUsed: boolean;
  length: number;
}

export interface LocalLengthBlockParams {
  lenBlock?: Partial<ILocalLengthBlock>;
}

export interface LocalLengthBlockJson extends LocalBaseBlockJson, ILocalLengthBlock {
  isIndefiniteForm: boolean;
  longFormUsed: boolean;
  length: number;
}

export class LocalLengthBlock extends LocalBaseBlock implements ILocalLengthBlock, IBerConvertible {

  public static override NAME = "lengthBlock";

  public isIndefiniteForm: boolean;
  public longFormUsed: boolean;
  public length: number;

  constructor({
    lenBlock = {},
  }: LocalLengthBlockParams = {}) {
    super();

    this.isIndefiniteForm = lenBlock.isIndefiniteForm ?? false;
    this.longFormUsed = lenBlock.longFormUsed ?? false;
    this.length = lenBlock.length ?? 0;
  }


  public fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
    const view = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);
    // Basic check for parameters
    if (!checkBufferParams(this, view, inputOffset, inputLength)) {
      return -1;
    }
    //#region Getting Uint8Array from ArrayBuffer
    const intBuffer = view.subarray(inputOffset, inputOffset + inputLength);
    //#endregion
    //#region Initial checks
    if (intBuffer.length === 0) {
      this.error = "Zero buffer length";

      return -1;
    }

    if (intBuffer[0] === 0xFF) {
      this.error = "Length block 0xFF is reserved by standard";

      return -1;
    }
    //#endregion
    //#region Check for length form type
    this.isIndefiniteForm = intBuffer[0] === 0x80;
    //#endregion
    //#region Stop working in case of indefinite length form
    if (this.isIndefiniteForm) {
      this.blockLength = 1;

      return (inputOffset + this.blockLength);
    }
    //#endregion
    //#region Check is long form of length encoding using
    this.longFormUsed = !!(intBuffer[0] & 0x80);
    //#endregion
    //#region Stop working in case of short form of length value
    if (this.longFormUsed === false) {
      this.length = (intBuffer[0]);
      this.blockLength = 1;

      return (inputOffset + this.blockLength);
    }
    //#endregion
    //#region Calculate length value in case of long form
    const count = intBuffer[0] & 0x7F;

    if (count > 8) // Too big length value
    {
      this.error = "Too big integer";

      return -1;
    }

    if ((count + 1) > intBuffer.length) {
      this.error = "End of input reached before message was fully decoded";

      return -1;
    }

    const lenOffset = inputOffset + 1;
    const lengthBufferView = view.subarray(lenOffset, lenOffset + count);

    if (lengthBufferView[count - 1] === 0x00)
      this.warnings.push("Needlessly long encoded length");

    this.length = pvutils.utilFromBase(lengthBufferView, 8);

    if (this.longFormUsed && (this.length <= 127))
      this.warnings.push("Unnecessary usage of long length form");

    this.blockLength = count + 1;
    //#endregion

    return (inputOffset + this.blockLength); // Return current offset in input buffer
  }

  public toBER(sizeOnly = false): ArrayBuffer {
    //#region Initial variables
    let retBuf: ArrayBuffer;
    let retView: Uint8Array;
    //#endregion
    if (this.length > 127)
      this.longFormUsed = true;

    if (this.isIndefiniteForm) {
      retBuf = new ArrayBuffer(1);

      if (sizeOnly === false) {
        retView = new Uint8Array(retBuf);
        retView[0] = 0x80;
      }

      return retBuf;
    }

    if (this.longFormUsed) {
      const encodedBuf = pvutils.utilToBase(this.length, 8);

      if (encodedBuf.byteLength > 127) {
        this.error = "Too big length";

        return (EMPTY_BUFFER);
      }

      retBuf = new ArrayBuffer(encodedBuf.byteLength + 1);

      if (sizeOnly)
        return retBuf;

      const encodedView = new Uint8Array(encodedBuf);
      retView = new Uint8Array(retBuf);

      retView[0] = encodedBuf.byteLength | 0x80;

      for (let i = 0; i < encodedBuf.byteLength; i++)
        retView[i + 1] = encodedView[i];

      return retBuf;
    }

    retBuf = new ArrayBuffer(1);

    if (sizeOnly === false) {
      retView = new Uint8Array(retBuf);

      retView[0] = this.length;
    }

    return retBuf;
  }

  public override toJSON(): LocalLengthBlockJson {
    return {
      ...super.toJSON(),
      isIndefiniteForm: this.isIndefiniteForm,
      longFormUsed: this.longFormUsed,
      length: this.length,
    };
  }
}
