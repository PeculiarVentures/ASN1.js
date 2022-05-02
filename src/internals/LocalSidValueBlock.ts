import { BufferSourceConverter } from "pvtsutils";
import * as pvutils from "pvutils";
import { HexBlockJson, HexBlockParams, HexBlock } from "../HexBlock";
import { ValueBlock, ValueBlockJson, ValueBlockParams } from "../ValueBlock";
import { EMPTY_BUFFER } from "./constants";
import * as utils from "./utils";

export interface ILocalSidValueBlock {
  valueDec: number;
  isFirstSid: boolean;
}

export interface LocalSidValueBlockParams extends HexBlockParams, ValueBlockParams, Partial<ILocalSidValueBlock> { }

export interface LocalSidValueBlockJson extends HexBlockJson, ValueBlockJson, ILocalSidValueBlock { }

export class LocalSidValueBlock extends HexBlock(ValueBlock) implements ILocalSidValueBlock {

  public static override NAME = "sidBlock";

  public valueDec: number;
  public isFirstSid: boolean;

  constructor({
    valueDec = -1,
    isFirstSid = false,
    ...parameters
  }: LocalSidValueBlockParams = {}) {
    super(parameters);

    this.valueDec = valueDec;
    this.isFirstSid = isFirstSid;
  }

  public override fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
    if (!inputLength) {
      return inputOffset;
    }
    const inputView = BufferSourceConverter.toUint8Array(inputBuffer);

    // Basic check for parameters
    if (!utils.checkBufferParams(this, inputView, inputOffset, inputLength)) {
      return -1;
    }

    const intBuffer = inputView.subarray(inputOffset, inputOffset + inputLength);

    this.valueView = new Uint8Array(inputLength);

    for (let i = 0; i < inputLength; i++) {
      this.valueView[i] = intBuffer[i] & 0x7F;

      this.blockLength++;

      if ((intBuffer[i] & 0x80) === 0x00)
        break;
    }

    //#region Adjust size of valueHex buffer
    const tempView = new Uint8Array(this.blockLength);

    for (let i = 0; i < this.blockLength; i++) {
      tempView[i] = this.valueView[i];
    }

    this.valueView = tempView;
    //#endregion

    if ((intBuffer[this.blockLength - 1] & 0x80) !== 0x00) {
      this.error = "End of input reached before message was fully decoded";

      return -1;
    }

    if (this.valueView[0] === 0x00)
      this.warnings.push("Needlessly long format of SID encoding");

    if (this.blockLength <= 8)
      this.valueDec = pvutils.utilFromBase(this.valueView, 7);
    else {
      this.isHexOnly = true;
      this.warnings.push("Too big SID for decoding, hex only");
    }

    return (inputOffset + this.blockLength);
  }

  public set valueBigInt(value: bigint) {

    utils.assertBigInt();

    let bits = BigInt(value).toString(2);
    while (bits.length % 7) {
      bits = "0" + bits;
    }
    const bytes = new Uint8Array(bits.length / 7);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(bits.slice(i * 7, i * 7 + 7), 2) + (i + 1 < bytes.length ? 0x80 : 0);
    }
    this.fromBER(bytes.buffer, 0, bytes.length);
  }

  public override toBER(sizeOnly?: boolean): ArrayBuffer {
    //#region Initial variables
    let retBuf: ArrayBuffer;
    let retView: Uint8Array;
    //#endregion
    if (this.isHexOnly) {
      if (sizeOnly)
        return (new ArrayBuffer(this.valueHex.byteLength));

      const curView = new Uint8Array(this.valueHex);

      retBuf = new ArrayBuffer(this.blockLength);
      retView = new Uint8Array(retBuf);

      for (let i = 0; i < (this.blockLength - 1); i++)
        retView[i] = curView[i] | 0x80;

      retView[this.blockLength - 1] = curView[this.blockLength - 1];

      return retBuf;
    }

    const encodedBuf = pvutils.utilToBase(this.valueDec, 7);
    if (encodedBuf.byteLength === 0) {
      this.error = "Error during encoding SID value";

      return (EMPTY_BUFFER);
    }

    retBuf = new ArrayBuffer(encodedBuf.byteLength);

    if (sizeOnly === false) {
      const encodedView = new Uint8Array(encodedBuf);
      retView = new Uint8Array(retBuf);

      for (let i = 0; i < (encodedBuf.byteLength - 1); i++)
        retView[i] = encodedView[i] | 0x80;

      retView[encodedBuf.byteLength - 1] = encodedView[encodedBuf.byteLength - 1];
    }

    return retBuf;
  }

  public override toString(): string {
    let result = "";

    if (this.isHexOnly)
      result = pvutils.bufferToHexCodes(this.valueHex, 0, this.valueHex.byteLength);
    else {
      if (this.isFirstSid) {
        let sidValue = this.valueDec;

        if (this.valueDec <= 39)
          result = "0.";
        else {
          if (this.valueDec <= 79) {
            result = "1.";
            sidValue -= 40;
          }
          else {
            result = "2.";
            sidValue -= 80;
          }
        }

        result += sidValue.toString();
      }

      else
        result = this.valueDec.toString();
    }

    return result;
  }

  public override toJSON(): LocalSidValueBlockJson {
    return {
      ...super.toJSON(),
      valueDec: this.valueDec,
      isFirstSid: this.isFirstSid,
    };
  }

}
