import { hex, toUint8Array } from "@peculiar/utils";
import { HexBlockJson, HexBlockParams, HexBlock } from "../HexBlock";
import { ValueBlockJson, ValueBlockParams } from "../ValueBlock";
import { LocalBaseBlock } from "./LocalBaseBlock";
import { EMPTY_BUFFER } from "./constants";
import { decodeBase128, encodeBase128 } from "./integerUtils";
import { checkBufferParams } from "./utils";

export interface ILocalRelativeSidValueBlock {
  valueDec: number;
}

export interface LocalRelativeSidValueBlockParams extends HexBlockParams, ValueBlockParams, Partial<ILocalRelativeSidValueBlock> {}

export interface LocalRelativeSidValueBlockJson extends HexBlockJson, ValueBlockJson, ILocalRelativeSidValueBlock {}

export class LocalRelativeSidValueBlock extends HexBlock(LocalBaseBlock) implements ILocalRelativeSidValueBlock {
  public static override NAME = "relativeSidBlock";

  public valueDec: number;

  constructor({ valueDec = 0, ...parameters }: LocalRelativeSidValueBlockParams = {}) {
    super(parameters);

    this.valueDec = valueDec;
  }

  public override fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
    if (inputLength === 0) return inputOffset;

    const inputView = toUint8Array(inputBuffer);

    // Basic check for parameters
    if (!checkBufferParams(this, inputView, inputOffset, inputLength)) return -1;

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

      for (let i = 0; i < this.blockLength; i++) tempView[i] = this.valueHexView[i];

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

  public override toBER(sizeOnly?: boolean): ArrayBuffer {
    if (this.isHexOnly) {
      if (sizeOnly) return new ArrayBuffer(this.valueHexView.byteLength);

      const curView = this.valueHexView;

      const retView = new Uint8Array(this.blockLength);

      for (let i = 0; i < this.blockLength - 1; i++) retView[i] = curView[i] | 0x80;

      retView[this.blockLength - 1] = curView[this.blockLength - 1];

      return retView.buffer;
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

    return retView.buffer;
  }

  public override toString(): string {
    let result = "";

    if (this.isHexOnly) result = hex.encode(this.valueHexView);
    else {
      result = this.valueDec.toString();
    }

    return result;
  }

  public override toJSON(): LocalRelativeSidValueBlockJson {
    return {
      ...super.toJSON(),
      valueDec: this.valueDec,
    };
  }
}
