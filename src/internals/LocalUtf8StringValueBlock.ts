import { binary, toUint8Array, utf8 } from "@peculiar/utils";
import {
  LocalSimpleStringBlock,
  LocalSimpleStringBlockJson,
  LocalSimpleStringBlockParams
} from "./LocalSimpleStringBlock";

export type LocalUtf8StringValueBlockParams = LocalSimpleStringBlockParams;
export type LocalUtf8StringValueBlockJson = LocalSimpleStringBlockJson;

export class LocalUtf8StringValueBlock extends LocalSimpleStringBlock {
  public static override NAME = "Utf8StringValueBlock";

  public override fromBuffer(inputBuffer: ArrayBuffer | Uint8Array): void {
    this.valueBlock.valueHexView = toUint8Array(inputBuffer);
    try {
      this.valueBlock.value = new TextDecoder("utf-8", { fatal: true }).decode(this.valueBlock.valueHexView);
    } catch (ex) {
      this.warnings.push(`Error during "decodeURIComponent": ${ex}, using raw string`);
      this.valueBlock.value = binary.encode(inputBuffer);
    }
  }

  public override fromString(inputString: string): void {
    this.valueBlock.valueHexView = utf8.encode(inputString);
    this.valueBlock.value = inputString;
  }
}
