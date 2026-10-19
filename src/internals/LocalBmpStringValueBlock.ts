import { toUint8Array, utf16 } from "@peculiar/utils";
import { LocalSimpleStringBlock, LocalSimpleStringBlockJson, LocalSimpleStringBlockParams } from "./LocalSimpleStringBlock";

export type LocalBmpStringValueBlockParams = LocalSimpleStringBlockParams;
export type LocalBmpStringValueBlockJson = LocalSimpleStringBlockJson;

export class LocalBmpStringValueBlock extends LocalSimpleStringBlock {
  public static override NAME = "BmpStringValueBlock";

  protected override checkValue(view: Uint8Array): string {
    return view.length % 2 !== 0 ? "BMPString value length must be a multiple of 2" : "";
  }

  public override fromBuffer(inputBuffer: ArrayBuffer | Uint8Array): void {
    this.valueBlock.value = utf16.decode(inputBuffer);
    this.valueBlock.valueHexView = toUint8Array(inputBuffer);
  }

  public override fromString(inputString: string): void {
    this.valueBlock.value = inputString;
    this.valueBlock.valueHexView = utf16.encode(inputString);
  }
}
