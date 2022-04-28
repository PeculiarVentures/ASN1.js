import { BaseBlockParams } from "../BaseBlock";
import { BaseStringBlock } from "../BaseStringBlock";
import { EMPTY_STRING } from "./constants";
import { LocalSimpleStringValueBlock, LocalSimpleStringValueBlockJson, LocalSimpleStringValueBlockParams } from "./LocalSimpleStringValueBlock";

export interface LocalSimpleStringBlockParams extends BaseBlockParams, LocalSimpleStringValueBlockParams { }

export class LocalSimpleStringBlock extends BaseStringBlock<LocalSimpleStringValueBlock, LocalSimpleStringValueBlockJson> {

  public static override NAME = "SIMPLE STRING";

  constructor({
    value = EMPTY_STRING,
    ...parameters
  }: LocalSimpleStringBlockParams = {}) {
    super(parameters, LocalSimpleStringValueBlock);
  }

  public override fromBuffer(inputBuffer: ArrayBuffer): void {
    this.valueBlock.value = String.fromCharCode.apply(null, new Uint8Array(inputBuffer) as unknown as number[]);
  }

  public fromString(inputString: string): void {
    const strLen = inputString.length;

    this.valueBlock.valueHex = new ArrayBuffer(strLen);
    const view = new Uint8Array(this.valueBlock.valueHex);

    for (let i = 0; i < strLen; i++)
      view[i] = inputString.charCodeAt(i);

    this.valueBlock.value = inputString;
  }

}
