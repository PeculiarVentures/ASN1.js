import * as pvutils from "pvutils";
import { BaseStringBlock, BaseStringBlockParams } from "./BaseStringBlock";
import { EMPTY_STRING } from "./internals/constants";
import { LocalUniversalStringValueBlockParams, LocalUniversalStringValueBlock, LocalUniversalStringValueBlockJson } from "./internals/LocalUniversalStringValueBlockParams";
import { IStringConvertible } from "./types";
import { typeStore } from "./TypeStore";

export interface UniversalStringParams extends BaseStringBlockParams, LocalUniversalStringValueBlockParams { }

export class UniversalString extends BaseStringBlock<LocalUniversalStringValueBlock, LocalUniversalStringValueBlockJson> implements IStringConvertible {

  static {
    typeStore.UniversalString = this;
  }

  public static override NAME = "UniversalString";

  constructor({
    value = EMPTY_STRING,
    ...parameters
  }: UniversalStringParams = {}) {
    super(parameters, LocalUniversalStringValueBlock);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 28; // UniversalString
  }

  public fromBuffer(inputBuffer: ArrayBuffer): void {
    const copyBuffer = inputBuffer.slice(0);
    const valueView = new Uint8Array(copyBuffer);

    for (let i = 0; i < valueView.length; i += 4) {
      valueView[i] = valueView[i + 3];
      valueView[i + 1] = valueView[i + 2];
      valueView[i + 2] = 0x00;
      valueView[i + 3] = 0x00;
    }

    this.valueBlock.value = String.fromCharCode.apply(null, new Uint32Array(copyBuffer) as unknown as number[]);
  }

  public fromString(inputString: string): void {
    const strLength = inputString.length;

    const valueHexView = this.valueBlock.valueHexView = new Uint8Array(strLength * 4);

    for (let i = 0; i < strLength; i++) {
      const codeBuf = pvutils.utilToBase(inputString.charCodeAt(i), 8);
      const codeView = new Uint8Array(codeBuf);
      if (codeView.length > 4)
        continue;

      const dif = 4 - codeView.length;

      for (let j = (codeView.length - 1); j >= 0; j--)
        valueHexView[i * 4 + j + dif] = codeView[j];
    }

    this.valueBlock.value = inputString;
  }

}
