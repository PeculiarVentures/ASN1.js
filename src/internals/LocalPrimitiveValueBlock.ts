import { HexBlock, HexBlockJson, HexBlockParams } from "../HexBlock";
import { ValueBlock, ValueBlockJson, ValueBlockParams } from "../ValueBlock";

export interface LocalPrimitiveValueBlockParams extends HexBlockParams, ValueBlockParams {}
export interface LocalPrimitiveValueBlockJson extends HexBlockJson, ValueBlockJson {}

export class LocalPrimitiveValueBlock extends HexBlock(ValueBlock) {
  public static override NAME = "PrimitiveValueBlock";

  constructor({ isHexOnly = true, ...parameters }: LocalPrimitiveValueBlockParams = {}) {
    super(parameters);

    this.isHexOnly = isHexOnly;
  }
}

/** @internal */
export const ORIGINAL_LOCAL_PRIMITIVE_TO_BER = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(LocalPrimitiveValueBlock.prototype),
  "toBER"
)?.value as Function;

export interface LocalPrimitiveValueBlock {
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
