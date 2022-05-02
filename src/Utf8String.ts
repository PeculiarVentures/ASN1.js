import { BufferSourceConverter } from "pvtsutils";
import { BaseStringBlock, BaseStringBlockParams } from "./BaseStringBlock";
import { LocalUtf8StringValueBlockParams, LocalUtf8StringValueBlock, LocalUtf8StringValueBlockJson } from "./internals/LocalUtf8StringValueBlock";
import { typeStore } from "./TypeStore";

export interface Utf8StringParams extends BaseStringBlockParams, LocalUtf8StringValueBlockParams { }

export class Utf8String extends BaseStringBlock<LocalUtf8StringValueBlock, LocalUtf8StringValueBlockJson> {

  static {
    typeStore.Utf8String = this;
  }

  public static override NAME = "UTF8String";

  constructor(parameters: Utf8StringParams = {}) {
    super(parameters, LocalUtf8StringValueBlock);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 12; // Utf8String
  }

  public override fromBuffer(inputBuffer: ArrayBuffer | Uint8Array): void {
    this.valueBlock.value = String.fromCharCode.apply(null, BufferSourceConverter.toUint8Array(inputBuffer) as unknown as number[]);

    try {
      this.valueBlock.value = decodeURIComponent(escape(this.valueBlock.value));
    }
    catch (ex) {
      this.warnings.push(`Error during "decodeURIComponent": ${ex}, using raw string`);
    }
  }

  public fromString(inputString: string): void {
    //noinspection JSDeprecatedSymbols
    const str = unescape(encodeURIComponent(inputString));
    const strLen = str.length;

    this.valueBlock.valueHex = new ArrayBuffer(strLen);
    const view = new Uint8Array(this.valueBlock.valueHex);

    for (let i = 0; i < strLen; i++)
      view[i] = str.charCodeAt(i);

    this.valueBlock.value = inputString;
  }

}
