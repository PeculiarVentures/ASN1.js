import * as pvtsutils from "pvtsutils";
import { BaseBlock, BaseBlockJson, BaseBlockParams } from "./BaseBlock";
import { LocalRealValueBlockParams, LocalRealValueBlock, LocalRealValueBlockJson } from "./internals/LocalRealValueBlock";
import { assertBigInt } from "./internals/utils";
import { typeStore } from "./TypeStore";
import { ViewWriter } from "./ViewWriter";

export interface RealParams extends BaseBlockParams, LocalRealValueBlockParams { }
export type RealJson = BaseBlockJson<LocalRealValueBlockJson>;

export class Real extends BaseBlock<LocalRealValueBlock, LocalRealValueBlockJson> {

  static {
    typeStore.Real = this;
  }

  public static override NAME = "REAL";

  constructor(parameters: RealParams = {}) {
    super(parameters, LocalRealValueBlock);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 9; // Real
  }

  /**
   * Converts Real into BigInt
   * @throws Throws Error if BigInt is not supported
   * @since 3.0.0
   */
  public toBigInt(): bigint {
    assertBigInt();

    return BigInt(this.valueBlock.toString());
  }

  /**
   * Creates Real from BigInt value
   * @param value BigInt value
   * @returns ASN.1 Real
   * @throws Throws Error if BigInt is not supported
   * @since 3.0.0
   */
  public static fromBigInt(value: number | string | bigint | boolean): Real {
    assertBigInt();

    const bigIntValue = BigInt(value);
    const writer = new ViewWriter();

    const hex = bigIntValue.toString(16).replace(/^-/, "");
    const view = new Uint8Array(pvtsutils.Convert.FromHex(hex));

    if (bigIntValue < 0) {
      // a negative number
      const first = new Uint8Array(view.length + (view[0] & 0x80 ? 1 : 0));
      first[0] |= 0x80;

      const firstInt = BigInt(`0x${pvtsutils.Convert.ToHex(first)}`);
      const secondInt = firstInt + bigIntValue;
      const second = pvtsutils.BufferSourceConverter.toUint8Array(pvtsutils.Convert.FromHex(secondInt.toString(16)));
      second[0] |= 0x80;

      writer.write(second);
    } else {
      // a positive number
      if (view[0] & 0x80) {
        writer.write(new Uint8Array([0]));
      }
      writer.write(view);
    }

    const res = new Real({
      valueHex: writer.final(),
    });

    return res;
  }

  public convertToDER(): Real {
    const real = new Real({ valueHex: this.valueBlock.valueHexView });

    real.valueBlock.toDER();

    return real;
  }

  /**
   * Convert current Integer value from DER to BER format
   * @returns
   */
  public convertFromDER(): Real {
    return new Real({
      valueHex: this.valueBlock.valueHexView[0] === 0
        ? this.valueBlock.valueHexView.subarray(1)
        : this.valueBlock.valueHexView,
    });
  }

  protected override onAsciiEncoding(): string {
    return `${(this.constructor as typeof Real).NAME} : ${this.valueBlock.toString()}`;
  }

}
