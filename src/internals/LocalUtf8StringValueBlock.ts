import { BufferSourceConverter, Convert } from "@peculiar/utils";
import { LocalSimpleStringBlock, type LocalSimpleStringBlockJson, type LocalSimpleStringBlockParams } from "./LocalSimpleStringBlock";

export type LocalUtf8StringValueBlockParams = LocalSimpleStringBlockParams;
export type LocalUtf8StringValueBlockJson = LocalSimpleStringBlockJson;

export class LocalUtf8StringValueBlock extends LocalSimpleStringBlock {
  public static override NAME = "Utf8StringValueBlock";

  public override fromBuffer(inputBuffer: ArrayBuffer | Uint8Array): void {
    this.valueBlock.valueHexView = BufferSourceConverter.toUint8Array(inputBuffer);
    try {
      this.valueBlock.value = Convert.ToUtf8String(inputBuffer);
    } catch (ex) {
      this.warnings.push(`Error during "decodeURIComponent": ${ex}, using raw string`);
      this.valueBlock.value = Convert.ToBinary(inputBuffer);
    }
  }

  public override fromString(inputString: string): void {
    this.valueBlock.valueHexView = new Uint8Array(Convert.FromUtf8String(inputString));
    this.valueBlock.value = inputString;
  }
}
