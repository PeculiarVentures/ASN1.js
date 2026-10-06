import * as pvutils from "pvutils";
import { HexBlockJson, HexBlockParams, HexBlock } from "../HexBlock";
import { IDerConvertible } from "../types";
import { ValueBlock, ValueBlockJson, ValueBlockParams } from "../ValueBlock";
import { bytesToSignedDecimal } from "./integerUtils";

export interface ILocalIntegerValueBlock {
  value: number;
}

export interface LocalIntegerValueBlockParams
  extends HexBlockParams, ValueBlockParams, Partial<ILocalIntegerValueBlock> {}

export interface LocalIntegerValueBlockJson extends HexBlockJson, ValueBlockJson {
  valueDec: number;
}

export class LocalIntegerValueBlock extends HexBlock(ValueBlock) implements IDerConvertible {
  protected setValueHex(): void {
    if (this.valueHexView.length >= 4) {
      this.warnings.push("Too big Integer for decoding, hex only");
      this.isHexOnly = true;
      this._valueDec = 0;
    } else {
      this.isHexOnly = false;

      if (this.valueHexView.length > 0) {
        this._valueDec = pvutils.utilDecodeTC.call(this);
      }
    }
  }

  public static override NAME = "IntegerValueBlock";

  static {
    Object.defineProperty(this.prototype, "valueHex", {
      set: function (this: LocalIntegerValueBlock, v: ArrayBuffer) {
        this.valueHexView = new Uint8Array(v);

        this.setValueHex();
      },
      get: function (this: LocalIntegerValueBlock) {
        return this.valueHexView.slice().buffer;
      }
    });
  }

  private _valueDec = 0;

  constructor({ value, ...parameters }: LocalIntegerValueBlockParams = {}) {
    super(parameters);

    if (parameters.valueHex) {
      this.setValueHex();
    }

    if (value !== undefined) {
      this.valueDec = value;
    }
  }

  public set valueDec(v: number) {
    this._valueDec = v;

    this.isHexOnly = false;
    this.valueHexView = new Uint8Array(pvutils.utilEncodeTC(v));
  }

  public get valueDec(): number {
    return this._valueDec;
  }

  public fromDER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number, expectedLength = 0): number {
    const offset = this.fromBER(inputBuffer, inputOffset, inputLength);
    if (offset === -1) return offset;

    const view = this.valueHexView;

    if (view[0] === 0x00 && (view[1] & 0x80) !== 0) {
      this.valueHexView = view.subarray(1);
    } else {
      if (expectedLength !== 0) {
        if (view.length < expectedLength) {
          if (expectedLength - view.length > 1) expectedLength = view.length + 1;

          this.valueHexView = view.subarray(expectedLength - view.length);
        }
      }
    }

    return offset;
  }

  public toDER(sizeOnly = false): ArrayBuffer {
    const view = this.valueHexView;

    switch (true) {
      case (view[0] & 0x80) !== 0:
        {
          const updatedView = new Uint8Array(this.valueHexView.length + 1);

          updatedView[0] = 0x00;
          updatedView.set(view, 1);

          this.valueHexView = updatedView;
        }
        break;
      case view[0] === 0x00 && (view[1] & 0x80) === 0:
        {
          this.valueHexView = this.valueHexView.subarray(1);
        }
        break;
      default:
    }

    return this.toBER(sizeOnly);
  }

  public override fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number {
    const resultOffset = super.fromBER(inputBuffer, inputOffset, inputLength);
    if (resultOffset === -1) {
      return resultOffset;
    }

    this.setValueHex();

    return resultOffset;
  }

  public override toBER(sizeOnly?: boolean): ArrayBuffer {
    return sizeOnly ? new ArrayBuffer(this.valueHexView.length) : this.valueHexView.slice().buffer;
  }

  public override toJSON(): LocalIntegerValueBlockJson {
    return {
      ...super.toJSON(),
      valueDec: this.valueDec
    };
  }

  public override toString(): string {
    return bytesToSignedDecimal(this.valueHexView);
  }
}

/** @internal */
export const ORIGINAL_LOCAL_INTEGER_TO_BER = LocalIntegerValueBlock.prototype.toBER;

/** @internal */
export const ORIGINAL_LOCAL_INTEGER_TO_STRING = LocalIntegerValueBlock.prototype.toString;

export interface LocalIntegerValueBlock {
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
