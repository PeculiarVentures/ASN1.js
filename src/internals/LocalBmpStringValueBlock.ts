import { BufferSourceConverter, Convert } from "@peculiar/utils";
import { LocalSimpleStringBlock, type LocalSimpleStringBlockJson, type LocalSimpleStringBlockParams } from "./LocalSimpleStringBlock";

export type LocalBmpStringValueBlockParams = LocalSimpleStringBlockParams;
export type LocalBmpStringValueBlockJson = LocalSimpleStringBlockJson;

export class LocalBmpStringValueBlock extends LocalSimpleStringBlock {
  public static override NAME = "BmpStringValueBlock";

  public override fromBuffer(inputBuffer: ArrayBuffer | Uint8Array): void {
    this.valueBlock.value = Convert.ToUtf16String(inputBuffer);
    this.valueBlock.valueHexView = BufferSourceConverter.toUint8Array(inputBuffer);
  }

  public override fromString(inputString: string): void {
    this.valueBlock.value = inputString;
    this.valueBlock.valueHexView = new Uint8Array(Convert.FromUtf16String(inputString));
  }
}
