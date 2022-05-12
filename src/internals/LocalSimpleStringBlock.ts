import * as pvtsutils from "pvtsutils";
import { BaseBlockParams } from "../BaseBlock";
import { BaseStringBlock } from "../BaseStringBlock";
import { LocalSimpleStringValueBlock, LocalSimpleStringValueBlockJson, LocalSimpleStringValueBlockParams } from "./LocalSimpleStringValueBlock";

export interface LocalSimpleStringBlockParams extends BaseBlockParams, LocalSimpleStringValueBlockParams { }
export type LocalSimpleStringBlockJson = LocalSimpleStringValueBlockJson;

export class LocalSimpleStringBlock extends BaseStringBlock<LocalSimpleStringValueBlock, LocalSimpleStringValueBlockJson> {

  public static override NAME = "SIMPLE STRING";

  constructor({
    ...parameters
  }: LocalSimpleStringBlockParams = {}) {
    super(parameters, LocalSimpleStringValueBlock);
  }

  public override fromBuffer(inputBuffer: ArrayBuffer | Uint8Array): void {
    this.valueBlock.value = String.fromCharCode.apply(null, pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer) as unknown as number[]);
  }

  public fromString(inputString: string): void {
    const strLen = inputString.length;

    const view = this.valueBlock.valueHexView = new Uint8Array(strLen);

    for (let i = 0; i < strLen; i++)
      view[i] = inputString.charCodeAt(i);

    this.valueBlock.value = inputString;
  }

}
