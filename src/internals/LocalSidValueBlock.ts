import { toArrayBuffer, toUint8Array } from "@peculiar/utils";
import { type HexBlockJson, type HexBlockParams, HexBlock } from "../HexBlock";
import { ValueBlock, type ValueBlockJson, type ValueBlockParams } from "../ValueBlock";
import { EMPTY_BUFFER } from "./constants";
import { decodeBase128, encodeBase128 } from "./integerUtils";
import { getSidValue, setSidValue } from "./oidUtils";
import * as utils from "./utils";

export interface ILocalSidValueBlock {
  valueDec: number;
  isFirstSid: boolean;
}

export interface LocalSidValueBlockParams extends HexBlockParams, ValueBlockParams, Partial<ILocalSidValueBlock> {}

export interface LocalSidValueBlockJson extends HexBlockJson, ValueBlockJson, ILocalSidValueBlock {}

export class LocalSidValueBlock extends HexBlock(ValueBlock) implements ILocalSidValueBlock {
  public static override NAME = "sidBlock";

  public valueDec: number;
  public isFirstSid: boolean;

  constructor({ valueDec = -1, isFirstSid = false, ...parameters }: LocalSidValueBlockParams = {}) {
    super(parameters);

    this.valueDec = valueDec;
    this.isFirstSid = isFirstSid;
  }

  public override fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
    if (!inputLength) {
      return inputOffset;
    }
    const inputView = toUint8Array(inputBuffer);

    // Basic check for parameters
    if (!utils.checkBufferParams(this, inputView, inputOffset, inputLength)) {
      return -1;
    }

    const intBuffer = inputView.subarray(inputOffset, inputOffset + inputLength);
    const fastPath = this.blockLength === 0 && Number.isInteger(inputOffset) && Number.isInteger(inputLength);

    if (fastPath) {
      let sidLength = 0;
      while (sidLength < inputLength) {
        const octet = intBuffer[sidLength];
        sidLength++;
        if ((octet & 0x80) === 0x00) break;
      }
      this.blockLength = sidLength;
      this.valueHexView = new Uint8Array(sidLength);
      for (let i = 0; i < sidLength; i++) this.valueHexView[i] = intBuffer[i] & 0x7f;
    } else {
      this.valueHexView = new Uint8Array(inputLength);

      for (let i = 0; i < inputLength; i++) {
        this.valueHexView[i] = intBuffer[i] & 0x7f;

        this.blockLength++;

        if ((intBuffer[i] & 0x80) === 0x00) break;
      }

      // #region Adjust size of valueHex buffer
      const tempView = new Uint8Array(this.blockLength);

      for (let i = 0; i < this.blockLength; i++) {
        tempView[i] = this.valueHexView[i];
      }

      this.valueHexView = tempView;
      // #endregion
    }

    if ((intBuffer[this.blockLength - 1] & 0x80) !== 0x00) {
      this.error = "End of input reached before message was fully decoded";

      return -1;
    }

    if (this.valueHexView[0] === 0x00) this.warnings.push("Needlessly long format of SID encoding");

    const valueDec = this.blockLength <= 8 ? decodeBase128(this.valueHexView) : undefined;
    if (valueDec !== undefined) this.valueDec = valueDec;
    else {
      this.isHexOnly = true;
      this.warnings.push("Too big SID for decoding, hex only");
    }

    return inputOffset + this.blockLength;
  }

  public set valueBigInt(value: bigint) {
    setSidValue(this, BigInt(value));
  }

  public override toBER(sizeOnly?: boolean): ArrayBuffer {
    if (this.isHexOnly) {
      if (sizeOnly) return new ArrayBuffer(this.valueHexView.byteLength);

      const curView = this.valueHexView;
      const retView = new Uint8Array(this.blockLength);

      for (let i = 0; i < this.blockLength - 1; i++) retView[i] = curView[i] | 0x80;

      retView[this.blockLength - 1] = curView[this.blockLength - 1];

      return toArrayBuffer(retView);
    }

    const encodedBuf = encodeBase128(this.valueDec);
    if (!encodedBuf) {
      this.error = "Error during encoding SID value";

      return EMPTY_BUFFER;
    }

    const retView = new Uint8Array(encodedBuf.byteLength);

    if (!sizeOnly) {
      const len = encodedBuf.byteLength - 1;

      for (let i = 0; i < len; i++) retView[i] = encodedBuf[i] | 0x80;

      retView[len] = encodedBuf[len];
    }

    return toArrayBuffer(retView);
  }

  public override toString(): string {
    const value = getSidValue(this);
    if (!this.isFirstSid) return value.toString();
    if (typeof value === "bigint") {
      if (value < 40n) return `0.${value}`;
      if (value < 80n) return `1.${value - 40n}`;
      return `2.${value - 80n}`;
    }

    if (value < 40) return `0.${value}`;
    if (value < 80) return `1.${value - 40}`;
    return `2.${value - 80}`;
  }

  public override toJSON(): LocalSidValueBlockJson {
    return {
      ...super.toJSON(),
      valueDec: this.valueDec,
      isFirstSid: this.isFirstSid,
    };
  }
}

export interface LocalSidValueBlock {
  /**
   * @deprecated since version 3.0.0
   */
  get valueBeforeDecode(): ArrayBuffer;
  set valueBeforeDecode(value: ArrayBuffer);
  /**
   * Binary data in ArrayBuffer representation
   *
   * @deprecated since version 3.0.0
   */
  get valueHex(): ArrayBuffer;
  set valueHex(value: ArrayBuffer);
}
