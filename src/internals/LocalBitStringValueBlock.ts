import * as pvutils from "pvutils";
import { ViewWriter } from "../ViewWriter";
import { HexBlockJson, HexBlockParams, HexBlock } from "../HexBlock";
import { BIT_STRING_NAME, EMPTY_BUFFER, END_OF_CONTENT_NAME } from "./constants";
import { LocalConstructedValueBlockParams, LocalConstructedValueBlockJson, LocalConstructedValueBlock } from "./LocalConstructedValueBlock";
import { fromBER } from "../parser";
import { checkBufferParams } from "./utils";
import { BufferSourceConverter } from "pvtsutils";

export interface ILocalBitStringValueBlock {
  unusedBits: number;
  isConstructed: boolean;
}

export interface LocalBitStringValueBlockParams extends HexBlockParams, LocalConstructedValueBlockParams, Partial<ILocalBitStringValueBlock> { }

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
    this.blockLength = this.valueHex.byteLength;
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
        if (this.unusedBits > 7) {
          this.error = "Unused bits for BitString must be in range 0-7";

          return -1;
        }
      }

      return resultOffset;
    }

    const inputView = BufferSourceConverter.toUint8Array(inputBuffer);

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
        const asn = fromBER(buf);
        if (asn.offset !== -1 && asn.offset === (inputLength - 1)) {
          this.value = [asn.result];
        }
      } catch (e) {
        // nothing
      }
    }

    // Copy input buffer to internal buffer
    this.valueView = intBuffer.subarray(1);
    this.blockLength = intBuffer.length;

    return (inputOffset + inputLength);
  }

  public override toBER(sizeOnly?: boolean, writer?: ViewWriter): ArrayBuffer {
    if (this.isConstructed) {
      return LocalConstructedValueBlock.prototype.toBER.call(this, sizeOnly, writer);
    }

    if (sizeOnly) {
      return new ArrayBuffer(this.valueHex.byteLength + 1);
    }

    if (!this.valueHex.byteLength) {
      return EMPTY_BUFFER;
    }

    const curView = new Uint8Array(this.valueHex);

    const retBuf = new ArrayBuffer(this.valueHex.byteLength + 1);
    const retView = new Uint8Array(retBuf);

    retView[0] = this.unusedBits;

    for (let i = 0; i < this.valueHex.byteLength; i++) {
      retView[i + 1] = curView[i];
    }

    return retBuf;
  }

  public override toJSON(): LocalBitStringValueBlockJson {
    return {
      ...super.toJSON(),
      unusedBits: this.unusedBits,
      isConstructed: this.isConstructed,
    } as LocalBitStringValueBlockJson;
  }
}
