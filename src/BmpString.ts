import * as pvtsutils from "pvtsutils";
import * as pvutils from "pvutils";
import { BaseBlockJson } from "./BaseBlock";
import { BaseStringBlock, BaseStringBlockParams } from "./BaseStringBlock";
import { EMPTY_STRING } from "./internals/constants";
import { LocalBmpStringValueBlockParams, LocalBmpStringValueBlock, LocalBmpStringValueBlockJson } from "./internals/LocalBmpStringValueBlock";
import { IStringConvertible } from "./types";
import { typeStore } from "./TypeStore";

export interface BmpStringParams extends BaseStringBlockParams, LocalBmpStringValueBlockParams { }
export type BmpStringJson = BaseBlockJson<LocalBmpStringValueBlockJson>;

export class BmpString extends BaseStringBlock<LocalBmpStringValueBlock, LocalBmpStringValueBlockJson> implements IStringConvertible {

  static {
    typeStore.BmpString = this;
  }
  public static override NAME = "BMPString";

  constructor({
    value = EMPTY_STRING,
    ...parameters
  }: BmpStringParams = {}) {
    super(parameters, LocalBmpStringValueBlock);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 30; // BmpString
  }

  public fromBuffer(inputBuffer: ArrayBuffer | Uint8Array): void {
    const valueView = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer).slice();

    for (let i = 0; i < valueView.length; i += 2) {
      const temp = valueView[i];

      valueView[i] = valueView[i + 1];
      valueView[i + 1] = temp;
    }

    this.valueBlock.value = String.fromCharCode.apply(null, new Uint16Array(valueView.buffer) as unknown as number[]);
  }

  public fromString(inputString: string): void {
    const strLength = inputString.length;

    const valueHexView = this.valueBlock.valueHexView = new Uint8Array(strLength * 2);

    for (let i = 0; i < strLength; i++) {
      const codeBuf = pvutils.utilToBase(inputString.charCodeAt(i), 8);
      const codeView = new Uint8Array(codeBuf);
      if (codeView.length > 2)
        continue;

      const dif = 2 - codeView.length;

      for (let j = (codeView.length - 1); j >= 0; j--)
        valueHexView[i * 2 + j + dif] = codeView[j];
    }

    this.valueBlock.value = inputString;
  }

}
