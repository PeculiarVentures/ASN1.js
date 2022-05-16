/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as pvtsutils from "pvtsutils";
import { IBerConvertible } from "./types";
import { EMPTY_BUFFER, EMPTY_VIEW } from "./internals/constants";
import { LocalBaseBlockConstructor } from "./internals/LocalBaseBlock";
import { checkBufferParams } from "./internals/utils";

export interface IHexBlock {
  isHexOnly: boolean;
  valueHex: pvtsutils.BufferSource;
}

export interface HexBlockJson extends Omit<IHexBlock, "valueHex"> {
  valueHex: string;
}

export type HexBlockParams = Partial<IHexBlock>;
/**
 * Class used as a base block for all remaining ASN.1 classes
 */
export function HexBlock<T extends LocalBaseBlockConstructor>(BaseClass: T) {
  return class Some extends BaseClass implements IHexBlock, IBerConvertible {

    public static override NAME = "hexBlock";

    public isHexOnly: boolean;
    /**
     * Binary data in ArrayBuffer representation
     *
     * @deprecated since version 3.0.0
     */
    public get valueHex(): ArrayBuffer {
      return this.valueHexView.slice().buffer;
    }
    /**
     * Binary data in ArrayBuffer representation
     *
     * @deprecated since version 3.0.0
     */
    public set valueHex(value: ArrayBuffer) {
      this.valueHexView = new Uint8Array(value);
    }
    /**
     * Binary data in Uint8Array representation
     *
     * @since 3.0.0
     */
    public valueHexView: Uint8Array;

    constructor(...args: any[]) {
      super(...args);

      const params: HexBlockParams = args[0] || {};
      this.isHexOnly = params.isHexOnly ?? false;
      this.valueHexView = params.valueHex ? pvtsutils.BufferSourceConverter.toUint8Array(params.valueHex) : EMPTY_VIEW;
    }

    public fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
      // Basic check for parameters
      const view = inputBuffer instanceof ArrayBuffer ? new Uint8Array(inputBuffer) : inputBuffer;
      if (!checkBufferParams(this, view, inputOffset, inputLength)) {
        return -1;
      }

      const endLength = inputOffset + inputLength;

      // Initial checks
      this.valueHexView = view.subarray(inputOffset, endLength);
      if (!this.valueHexView.length) {
        this.warnings.push("Zero buffer length");

        return inputOffset;
      }

      this.blockLength = inputLength;

      return endLength;
    }

    public toBER(sizeOnly = false): ArrayBuffer {
      if (!this.isHexOnly) {
        this.error = "Flag 'isHexOnly' is not set, abort";

        return EMPTY_BUFFER;
      }

      if (sizeOnly) {
        return new ArrayBuffer(this.valueHexView.byteLength);
      }

      // Don't copy data if View is not offset
      return (this.valueHexView.byteLength === this.valueHexView.buffer.byteLength)
        ? this.valueHexView.buffer
        : this.valueHexView.slice().buffer;
    }

    /**
     * Returns a JSON representation of an object
     * @returns JSON object
     */
    public override toJSON() {
      return {
        ...super.toJSON(),
        isHexOnly: this.isHexOnly,
        valueHex: pvtsutils.Convert.ToHex(this.valueHexView),
      };
    }

  };
}
