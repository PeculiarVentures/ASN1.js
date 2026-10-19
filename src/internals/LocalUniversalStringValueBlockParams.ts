import { toUint8Array, uint } from "@peculiar/utils";
import { LocalSimpleStringBlock, LocalSimpleStringBlockJson, LocalSimpleStringBlockParams } from "./LocalSimpleStringBlock";

export type LocalUniversalStringValueBlockParams = LocalSimpleStringBlockParams;
export type LocalUniversalStringValueBlockJson = LocalSimpleStringBlockJson;

const MAX_CODE_POINT = 0x10ffff;
const REPLACEMENT_CHARACTER = "\ufffd";

export class LocalUniversalStringValueBlock extends LocalSimpleStringBlock {
  public static override NAME = "UniversalStringValueBlock";

  public override fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
    if (this.lenBlock.length % 4 !== 0) {
      this.error = "UniversalString value length must be a multiple of 4";

      return -1;
    }

    return super.fromBER(inputBuffer, inputOffset, inputLength);
  }

  public override fromBuffer(inputBuffer: ArrayBuffer | Uint8Array): void {
    const view = toUint8Array(inputBuffer);
    let value = "";

    for (let i = 0; i + 4 <= view.length; i += 4) {
      const codePoint = uint.decode(view.subarray(i, i + 4));
      if (codePoint > MAX_CODE_POINT) {
        this.warnings.push(`Code point 0x${codePoint.toString(16)} is outside the Unicode range, using U+FFFD`);
        value += REPLACEMENT_CHARACTER;
      } else {
        value += String.fromCodePoint(codePoint);
      }
    }

    this.valueBlock.value = value;
  }

  public override fromString(inputString: string): void {
    const codePoints = Array.from(inputString, (char) => char.codePointAt(0) as number);

    const valueHexView = (this.valueBlock.valueHexView = new Uint8Array(codePoints.length * 4));

    for (let i = 0; i < codePoints.length; i++) valueHexView.set(uint.encode(codePoints[i], { length: 4 }), i * 4);

    this.valueBlock.value = inputString;
  }
}
