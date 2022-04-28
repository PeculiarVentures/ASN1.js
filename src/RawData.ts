import { IBerConvertible } from "./types";
import { EMPTY_BUFFER } from "./internals/constants";

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

  public fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number {
    this.data = inputBuffer.slice(inputOffset, inputLength);

    return (inputOffset + inputLength);
  }

  public toBER(sizeOnly?: boolean): ArrayBuffer {
    return this.data;
  }

}
