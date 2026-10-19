import { binary, toUint8Array, utf8 } from "@peculiar/utils";
import { LocalSimpleStringBlock, LocalSimpleStringBlockJson, LocalSimpleStringBlockParams } from "./LocalSimpleStringBlock";

export type LocalUtf8StringValueBlockParams = LocalSimpleStringBlockParams;
export type LocalUtf8StringValueBlockJson = LocalSimpleStringBlockJson;

// utf8.decode replaces invalid sequences and strips a leading BOM; ASN.1 needs the exact bytes
const strictUtf8Decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
const LONE_SURROGATE = /\p{Cs}/u;

export class LocalUtf8StringValueBlock extends LocalSimpleStringBlock {
  public static override NAME = "Utf8StringValueBlock";

  public override fromBuffer(inputBuffer: ArrayBuffer | Uint8Array): void {
    this.valueBlock.valueHexView = toUint8Array(inputBuffer);
    try {
      this.valueBlock.value = strictUtf8Decoder.decode(this.valueBlock.valueHexView);
    } catch (ex) {
      this.warnings.push(`Error during "decodeURIComponent": ${ex}, using raw string`);
      this.valueBlock.value = binary.encode(inputBuffer);
    }
  }

  public override fromString(inputString: string): void {
    if (LONE_SURROGATE.test(inputString)) throw new TypeError("The string contains lone surrogates and cannot be encoded as UTF-8");

    this.valueBlock.valueHexView = utf8.encode(inputString);
    this.valueBlock.value = inputString;
  }
}
