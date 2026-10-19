import { toUint8Array, utf16 } from "@peculiar/utils";
import { LocalSimpleStringBlock, LocalSimpleStringBlockJson, LocalSimpleStringBlockParams } from "./LocalSimpleStringBlock";

export type LocalBmpStringValueBlockParams = LocalSimpleStringBlockParams;
export type LocalBmpStringValueBlockJson = LocalSimpleStringBlockJson;

export class LocalBmpStringValueBlock extends LocalSimpleStringBlock {
  public static override NAME = "BmpStringValueBlock";

  public override fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
    if (this.lenBlock.length % 2 !== 0) {
      this.error = "BMPString value length must be a multiple of 2";

      return -1;
    }

    return super.fromBER(inputBuffer, inputOffset, inputLength);
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
