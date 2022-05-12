/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ViewWriter } from "../ViewWriter";
import { HexBlockJson, HexBlockParams, HexBlock } from "../HexBlock";
import { END_OF_CONTENT_NAME, OCTET_STRING_NAME } from "./constants";
import { LocalConstructedValueBlockParams, LocalConstructedValueBlockJson, LocalConstructedValueBlock } from "./LocalConstructedValueBlock";
import type { OctetString } from "../OctetString";

export interface ILocalOctetStringValueBlock {
  isConstructed: boolean;
}

export interface LocalOctetStringValueBlockParams extends HexBlockParams, LocalConstructedValueBlockParams, Partial<ILocalOctetStringValueBlock> {
  value?: OctetString[];
}

export interface LocalOctetStringValueBlockJson extends HexBlockJson, LocalConstructedValueBlockJson, ILocalOctetStringValueBlock { }

export class LocalOctetStringValueBlock extends HexBlock(LocalConstructedValueBlock) {

  public static override NAME = "OctetStringValueBlock";

  public isConstructed: boolean;

  constructor({
    isConstructed = false,
    ...parameters
  }: LocalOctetStringValueBlockParams = {}) {
    super(parameters);

    this.isConstructed = isConstructed;
  }

  public override fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number {
    let resultOffset = 0;

    if (this.isConstructed) {
      this.isHexOnly = false;

      resultOffset = LocalConstructedValueBlock.prototype.fromBER.call(this, inputBuffer, inputOffset, inputLength);
      if (resultOffset === -1)
        return resultOffset;

      for (let i = 0; i < this.value.length; i++) {
        const currentBlockName = (this.value[i].constructor as typeof LocalOctetStringValueBlock).NAME;

        if (currentBlockName === END_OF_CONTENT_NAME) {
          if (this.isIndefiniteForm)
            break;
          else {
            this.error = "EndOfContent is unexpected, OCTET STRING may consists of OCTET STRINGs only";

            return -1;
          }
        }

        if (currentBlockName !== OCTET_STRING_NAME) {
          this.error = "OCTET STRING may consists of OCTET STRINGs only";

          return -1;
        }
      }
    } else {
      this.isHexOnly = true;

      resultOffset = super.fromBER(inputBuffer, inputOffset, inputLength);
      this.blockLength = inputLength;
    }

    return resultOffset;
  }

  public override toBER(sizeOnly?: boolean, writer?: ViewWriter): ArrayBuffer {
    if (this.isConstructed)
      return LocalConstructedValueBlock.prototype.toBER.call(this, sizeOnly, writer);

    return sizeOnly
      ? new ArrayBuffer(this.valueHexView.byteLength)
      : this.valueHexView.slice().buffer;
  }

  public override toJSON(): LocalOctetStringValueBlockJson {
    return {
      ...super.toJSON(),
      isConstructed: this.isConstructed,
    } as LocalOctetStringValueBlockJson;
  }

}

export interface LocalOctetStringValueBlock {
  /**
   * @deprecated since version 3.0.0
   */
  // @ts-ignore
  valueBeforeDecode: ArrayBuffer;
  /**
   * Binary data in ArrayBuffer representation
   *
   * @deprecated since version 3.0.0
   */
  // @ts-ignore
  valueHex: ArrayBuffer;
}
