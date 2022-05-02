import { IBerConvertible } from "./types";
import { EMPTY_BUFFER } from "./internals/constants";
import { BufferSourceConverter } from "pvtsutils";

export interface IRawData {
  data: ArrayBuffer;
}

export type RawDataParams = Partial<IRawData>;

/**
 * Special class providing ability to have "toBER/fromBER" for raw ArrayBuffer
 */
export class RawData implements IBerConvertible {

  public data: ArrayBuffer;

  constructor({ data = EMPTY_BUFFER } = {}) {
    this.data = data;
  }

  public fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
    const endLength = inputOffset + inputLength;
    this.data = BufferSourceConverter.toUint8Array(inputBuffer).subarray(inputOffset, endLength);

    return endLength;
  }

  public toBER(sizeOnly?: boolean): ArrayBuffer {
    return this.data;
  }

}
