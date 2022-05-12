/* eslint-disable @typescript-eslint/ban-ts-comment */
import { HexBlockJson, HexBlockParams, HexBlock } from "../HexBlock";
import { ValueBlock, ValueBlockJson, ValueBlockParams } from "../ValueBlock";
import { EMPTY_STRING } from "./constants";
import { LocalUtf8StringValueBlockParams, LocalUtf8StringValueBlockJson } from "./LocalUtf8StringValueBlock";

export interface ILocalStringValueBlock {
  value: string;
}

export interface LocalStringValueBlockParams extends Omit<HexBlockParams, "isHexOnly">, ValueBlockParams, Partial<ILocalStringValueBlock> { }

export interface LocalStringValueBlockJson extends HexBlockJson, ValueBlockJson, ILocalStringValueBlock { }

export abstract class LocalStringValueBlock extends HexBlock(ValueBlock) implements ILocalStringValueBlock {

  public static override NAME = "StringValueBlock";

  public value: string;

  constructor({
    ...parameters
  }: LocalUtf8StringValueBlockParams = {}) {
    super(parameters);

    this.isHexOnly = true;
    this.value = EMPTY_STRING; // String representation of decoded ArrayBuffer
  }

  public override toJSON(): LocalUtf8StringValueBlockJson {
    return {
      ...super.toJSON(),
      value: this.value,
    };
  }

}

export interface LocalStringValueBlock {
  /**
   * @deprecated since version 3.0.0
   */
  // @ts-ignore
  valueBeforeDecode: ArrayBuffer;
  /**
   * Binary data in ArrayBuffer representation
   *
   * @deprecated since version 3.0.0
   */
  // @ts-ignore
  valueHex: ArrayBuffer;
}
