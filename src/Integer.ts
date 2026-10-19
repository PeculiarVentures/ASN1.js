import { BaseBlock, BaseBlockJson, BaseBlockParams } from "./BaseBlock";
import { LocalIntegerValueBlockParams, LocalIntegerValueBlock, LocalIntegerValueBlockJson, ORIGINAL_LOCAL_INTEGER_TO_STRING } from "./internals/LocalIntegerValueBlock";
import { assertBigInt } from "./internals/utils";
import { bytesToSignedBigInt, signedBigIntToBytes } from "./internals/integerUtils";
import { typeStore } from "./TypeStore";

export interface IntegerParams extends BaseBlockParams, LocalIntegerValueBlockParams {}
export type IntegerJson = BaseBlockJson<LocalIntegerValueBlockJson>;

export class Integer extends BaseBlock<LocalIntegerValueBlock, LocalIntegerValueBlockJson> {
  static {
    typeStore.Integer = this;
  }

  public static override NAME = "INTEGER";

  constructor(parameters: IntegerParams = {}) {
    super(parameters, LocalIntegerValueBlock);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 2; // Integer
  }

  /**
   * Converts Integer into BigInt
   * @throws Throws Error if BigInt is not supported
   * @since 3.0.0
   */
  public toBigInt(): bigint {
    assertBigInt();

    const valueBlock = this.valueBlock;
    const toString = valueBlock.toString;

    if (toString === ORIGINAL_LOCAL_INTEGER_TO_STRING) return bytesToSignedBigInt(valueBlock.valueHexView);

    return BigInt(Reflect.apply(toString, valueBlock, []));
  }

  /**
   * Creates Integer from BigInt value
   * @param value BigInt value
   * @returns ASN.1 Integer
   * @throws Throws Error if BigInt is not supported
   * @since 3.0.0
   */
  public static fromBigInt(value: number | string | bigint | boolean): Integer {
    assertBigInt();

    return new Integer({ valueHex: signedBigIntToBytes(BigInt(value)) });
  }

  public convertToDER(): Integer {
    const integer = new Integer({ valueHex: this.valueBlock.valueHexView });

    integer.valueBlock.toDER();

    return integer;
  }

  /**
   * Convert current Integer value from DER to BER format
   * @returns
   */
  public convertFromDER(): Integer {
    return new Integer({
      valueHex: this.valueBlock.valueHexView[0] === 0 ? this.valueBlock.valueHexView.subarray(1) : this.valueBlock.valueHexView,
    });
  }

  protected override onAsciiEncoding(): string {
    return `${(this.constructor as typeof Integer).NAME} : ${this.valueBlock.toString()}`;
  }
}
