import * as pvutils from "pvutils";
import { LocalSimpleStringBlock, LocalSimpleStringBlockJson, LocalSimpleStringBlockParams } from "./LocalSimpleStringBlock";

export type LocalUniversalStringValueBlockParams = LocalSimpleStringBlockParams;
export type LocalUniversalStringValueBlockJson = LocalSimpleStringBlockJson;

export class LocalUniversalStringValueBlock extends LocalSimpleStringBlock {

  public static override NAME = "UniversalStringValueBlock";

  public override fromBuffer(inputBuffer: ArrayBuffer | Uint8Array): void {
    const copyBuffer = ArrayBuffer.isView(inputBuffer) ? inputBuffer.slice().buffer : inputBuffer.slice(0);
    const valueView = new Uint8Array(copyBuffer);

    for (let i = 0; i < valueView.length; i += 4) {
      valueView[i] = valueView[i + 3];
      valueView[i + 1] = valueView[i + 2];
      valueView[i + 2] = 0x00;
      valueView[i + 3] = 0x00;
    }

    this.valueBlock.value = String.fromCharCode.apply(null, new Uint32Array(copyBuffer) as unknown as number[]);
  }

  public override fromString(inputString: string): void {
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
