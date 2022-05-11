import * as pvtsutils from "pvtsutils";
import { IBerConvertible } from "./types";
import { EMPTY_VIEW } from "./internals/constants";

export interface IRawData {
  data: ArrayBuffer;
}

export type RawDataParams = Partial<IRawData>;

/**
 * Special class providing ability to have "toBER/fromBER" for raw ArrayBuffer
 */
export class RawData implements IBerConvertible {


  /**
   * @deprecated Since v3.0.0
   */
  public get data(): ArrayBuffer {
    return this.dataView.slice().buffer;
  }

  /**
   * @deprecated Since v3.0.0
   */
  public set data(value: ArrayBuffer) {
    this.dataView = pvtsutils.BufferSourceConverter.toUint8Array(value);
  }

  /**
   * @since 3.0.0
   */
  public dataView: Uint8Array;

  constructor({ data = EMPTY_VIEW }: RawDataParams = {}) {
    this.dataView = pvtsutils.BufferSourceConverter.toUint8Array(data);
  }

  public fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
    const endLength = inputOffset + inputLength;
    this.dataView = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer).subarray(inputOffset, endLength);

    return endLength;
  }

  public toBER(sizeOnly?: boolean): ArrayBuffer {
    return this.dataView.slice().buffer;
  }

}
