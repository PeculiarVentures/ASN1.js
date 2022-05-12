/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as pvtsutils from "pvtsutils";
import { ViewWriter } from "../ViewWriter";
import { HexBlockJson, HexBlockParams, HexBlock } from "../HexBlock";
import { BIT_STRING_NAME, EMPTY_BUFFER, END_OF_CONTENT_NAME } from "./constants";
import { LocalConstructedValueBlockParams, LocalConstructedValueBlockJson, LocalConstructedValueBlock } from "./LocalConstructedValueBlock";
import { localFromBER } from "../parser";
import { checkBufferParams } from "./utils";
import type { BitString } from "../BitString";

export interface ILocalBitStringValueBlock {
  unusedBits: number;
  isConstructed: boolean;
}

export interface LocalBitStringValueBlockParams extends HexBlockParams, LocalConstructedValueBlockParams, Partial<ILocalBitStringValueBlock> {
  value?: BitString[];
}

export interface LocalBitStringValueBlockJson extends HexBlockJson, LocalConstructedValueBlockJson, ILocalBitStringValueBlock { }

export class LocalBitStringValueBlock extends HexBlock(LocalConstructedValueBlock) implements ILocalBitStringValueBlock {

  public static override NAME = "BitStringValueBlock";

  public unusedBits: number;
  public isConstructed: boolean;

  constructor({
    unusedBits = 0,
    isConstructed = false,
    ...parameters
  }: LocalBitStringValueBlockParams = {}) {
    super(parameters);

    this.unusedBits = unusedBits;
    this.isConstructed = isConstructed;
    this.blockLength = this.valueHexView.byteLength;
  }

  public override fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
    // Ability to decode zero-length BitString value
    if (!inputLength) {
      return inputOffset;
    }

    let resultOffset = -1;

    // If the BIT STRING supposed to be a constructed value
    if (this.isConstructed) {
      resultOffset = LocalConstructedValueBlock.prototype.fromBER.call(this, inputBuffer, inputOffset, inputLength);
      if (resultOffset === -1)
        return resultOffset;

      for (const value of this.value) {
        const currentBlockName = (value.constructor as typeof LocalBitStringValueBlock).NAME;

        if (currentBlockName === END_OF_CONTENT_NAME) {
          if (this.isIndefiniteForm)
            break;
          else {
            this.error = "EndOfContent is unexpected, BIT STRING may consists of BIT STRINGs only";

            return -1;
          }
        }

        if (currentBlockName !== BIT_STRING_NAME) {
          this.error = "BIT STRING may consists of BIT STRINGs only";

          return -1;
        }

        const valueBlock = value.valueBlock as unknown as LocalBitStringValueBlock;
        if ((this.unusedBits > 0) && (valueBlock.unusedBits > 0)) {
          this.error = "Using of \"unused bits\" inside constructive BIT STRING allowed for least one only";

          return -1;
        }

        this.unusedBits = valueBlock.unusedBits;
      }

      return resultOffset;
    }

    const inputView = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);

    //If the BitString supposed to be a primitive value
    if (!checkBufferParams(this, inputView, inputOffset, inputLength)) {
      return -1;
    }

    const intBuffer = inputView.subarray(inputOffset, inputOffset + inputLength);

    this.unusedBits = intBuffer[0];

    if (this.unusedBits > 7) {
      this.error = "Unused bits for BitString must be in range 0-7";

      return -1;
    }

    if (!this.unusedBits) {
      const buf = intBuffer.subarray(1);
      try {
        if (buf.byteLength) {
          const asn = localFromBER(buf, 0, buf.byteLength);
          if (asn.offset !== -1 && asn.offset === (inputLength - 1)) {
            this.value = [asn.result as BitString];
          }
        }
      } catch (e) {
        // nothing
      }
    }

    // Copy input buffer to internal buffer
    this.valueHexView = intBuffer.subarray(1);
    this.blockLength = intBuffer.length;

    return (inputOffset + inputLength);
  }

  public override toBER(sizeOnly?: boolean, writer?: ViewWriter): ArrayBuffer {
    if (this.isConstructed) {
      return LocalConstructedValueBlock.prototype.toBER.call(this, sizeOnly, writer);
    }

    if (sizeOnly) {
      return new ArrayBuffer(this.valueHexView.byteLength + 1);
    }

    if (!this.valueHexView.byteLength) {
      return EMPTY_BUFFER;
    }

    const retView = new Uint8Array(this.valueHexView.length + 1);

    retView[0] = this.unusedBits;
    retView.set(this.valueHexView, 1);

    return retView.buffer;
  }

  public override toJSON(): LocalBitStringValueBlockJson {
    return {
      ...super.toJSON(),
      unusedBits: this.unusedBits,
      isConstructed: this.isConstructed,
    } as LocalBitStringValueBlockJson;
  }
}

export interface LocalBitStringValueBlock {
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
