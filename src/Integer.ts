import * as pvtsutils from "pvtsutils";
import { BaseBlock, BaseBlockParams } from "./BaseBlock";
import * as utils from "./internals/utils";
import { LocalIntegerValueBlockParams, LocalIntegerValueBlock, LocalIntegerValueBlockJson } from "./internals/LocalIntegerValueBlock";
import { typeStore } from "./TypeStore";


export interface IntegerParams extends BaseBlockParams, LocalIntegerValueBlockParams { }

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
    const expectedLength = (this.valueBlock.valueHexView.byteLength % 2) ? (this.valueBlock.valueHexView.byteLength + 1) : this.valueBlock.valueHexView.byteLength;
    const integer = new Integer({ valueHex: this.valueBlock.valueHexView });
    integer.valueBlock.fromDER(integer.valueBlock.valueHexView, 0, integer.valueBlock.valueHexView.byteLength, expectedLength);

    return integer;
  }

  public override toString(): string {
    utils.assertBigInt();
    const hex = pvtsutils.Convert.ToHex(this.valueBlock.valueHexView);
    const bigInt = BigInt(`0x${hex}`);

    return `${(this.constructor as typeof Integer).NAME} : ${bigInt.toString()}`;
  }
}
