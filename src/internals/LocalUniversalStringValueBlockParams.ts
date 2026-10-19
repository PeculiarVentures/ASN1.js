import { toUint8Array, uint } from "@peculiar/utils";
import { LocalSimpleStringBlock, type LocalSimpleStringBlockJson, type LocalSimpleStringBlockParams } from "./LocalSimpleStringBlock";

export type LocalUniversalStringValueBlockParams = LocalSimpleStringBlockParams;
export type LocalUniversalStringValueBlockJson = LocalSimpleStringBlockJson;

const MAX_CODE_POINT = 0x10ffff;
const REPLACEMENT_CODE_POINT = 0xfffd;

export class LocalUniversalStringValueBlock extends LocalSimpleStringBlock {
  public static override NAME = "UniversalStringValueBlock";

  protected override checkValue(view: Uint8Array): string {
    return view.length % 4 !== 0 ? "UniversalString value length must be a multiple of 4" : "";
  }

  public override fromBuffer(inputBuffer: ArrayBuffer | Uint8Array): void {
    const view = toUint8Array(inputBuffer);
    const data = new DataView(view.buffer, view.byteOffset, view.byteLength);
    const count = view.length >> 2;
    const codePoints: number[] = [];

    for (let i = 0; i < count; i++) {
      const codePoint = data.getUint32(i * 4);
      if (codePoint > MAX_CODE_POINT) {
        this.warnings.push(`Code point 0x${codePoint.toString(16)} is outside the Unicode range, using U+FFFD`);
        codePoints.push(REPLACEMENT_CODE_POINT);
      } else if (codePoint >= 0xd800 && codePoint <= 0xdfff) {
        // Older versions wrote characters outside the BMP as two UTF-16 surrogates, so keep a valid pair
        const next = i + 1 < count ? data.getUint32((i + 1) * 4) : 0;
        if (codePoint <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) {
          codePoints.push(0x10000 + ((codePoint - 0xd800) << 10) + (next - 0xdc00));
          i++;
        } else {
          this.warnings.push(`Code point 0x${codePoint.toString(16)} is a lone surrogate, using U+FFFD`);
          codePoints.push(REPLACEMENT_CODE_POINT);
        }
      } else {
        codePoints.push(codePoint);
      }
    }

    let value = "";
    // Chunk to stay below the engine's argument count limit
    for (let i = 0; i < codePoints.length; i += 0x2000) value += String.fromCodePoint(...codePoints.slice(i, i + 0x2000));

    this.valueBlock.value = value;
  }

  public override fromString(inputString: string): void {
    const codePoints = Array.from(inputString, (char) => char.codePointAt(0) as number);

    const valueHexView = (this.valueBlock.valueHexView = new Uint8Array(codePoints.length * 4));

    for (let i = 0; i < codePoints.length; i++) valueHexView.set(uint.encode(codePoints[i], { length: 4 }), i * 4);

    this.valueBlock.value = inputString;
  }
}
