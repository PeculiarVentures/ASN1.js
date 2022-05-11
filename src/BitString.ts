import { BaseBlock, BaseBlockJson, BaseBlockParams } from "./BaseBlock";
import { Constructed } from "./Constructed";
import { BIT_STRING_NAME } from "./internals/constants";
import { LocalBitStringValueBlockParams, LocalBitStringValueBlock, LocalBitStringValueBlockJson } from "./internals/LocalBitStringValueBlock";
import { typeStore } from "./TypeStore";

export interface BitStringParams extends BaseBlockParams, LocalBitStringValueBlockParams { }
export type BitStringJson = BaseBlockJson<LocalBitStringValueBlockJson>;

export class BitString extends BaseBlock<LocalBitStringValueBlock, LocalBitStringValueBlockJson> {

  static {
    typeStore.BitString = this;
  }

  public static override NAME = BIT_STRING_NAME;

  constructor(parameters: BitStringParams = {}) {
    super(parameters, LocalBitStringValueBlock);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 3; // BitString
  }

  public override fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
    // Ability to encode empty BitString
    if (inputLength === 0) {
      return inputOffset;
    }

    this.valueBlock.isConstructed = this.idBlock.isConstructed;
    this.valueBlock.isIndefiniteForm = this.lenBlock.isIndefiniteForm;

    return super.fromBER(inputBuffer, inputOffset, inputLength);
  }

  public override toString(): string {
    if (this.valueBlock.isConstructed || (this.valueBlock.value && this.valueBlock.value.length)) {
      return Constructed.prototype.toString.call(this);
    } else {
      // convert bytes to bits
      const bits = [];
      const valueHex = this.valueBlock.valueHexView;
      for (const byte of valueHex) {
        bits.push(byte.toString(2).padStart(8, "0"));
      }

      return `${(this.constructor as typeof BitString).NAME} : ${bits.join("")}`;
    }
  }

}
