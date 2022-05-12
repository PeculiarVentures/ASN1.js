import { BaseBlock, BaseBlockJson, BaseBlockParams } from "./BaseBlock";
import { LocalConstructedValueBlock, LocalConstructedValueBlockJson, LocalConstructedValueBlockParams } from "./internals/LocalConstructedValueBlock";
import { typeStore } from "./TypeStore";

export interface ConstructedParams extends BaseBlockParams, LocalConstructedValueBlockParams { }
export type ConstructedJson = BaseBlockJson<LocalConstructedValueBlockJson>;

export class Constructed extends BaseBlock<LocalConstructedValueBlock, LocalConstructedValueBlockJson> {

  static {
    typeStore.Constructed = this;
  }

  public static override NAME = "CONSTRUCTED";

  constructor(parameters: ConstructedParams = {}) {
    super(parameters, LocalConstructedValueBlock);

    this.idBlock.isConstructed = true;
  }

  public override fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
    this.valueBlock.isIndefiniteForm = this.lenBlock.isIndefiniteForm;

    const resultOffset = this.valueBlock.fromBER(inputBuffer, inputOffset, (this.lenBlock.isIndefiniteForm) ? inputLength : this.lenBlock.length);
    if (resultOffset === -1) {
      this.error = this.valueBlock.error;

      return resultOffset;
    }

    if (!this.idBlock.error.length)
      this.blockLength += this.idBlock.blockLength;

    if (!this.lenBlock.error.length)
      this.blockLength += this.lenBlock.blockLength;

    if (!this.valueBlock.error.length)
      this.blockLength += this.valueBlock.blockLength;

    return resultOffset;
  }

  /**
   * @internal
   */
  public override onAsciiEncoding(): string {
    const values = [];
    for (const value of this.valueBlock.value) {
      values.push(value.toString("ascii").split("\n").map(o => `  ${o}`).join("\n"));
    }
    const blockName = this.idBlock.tagClass === 3
      ? `[${this.idBlock.tagNumber}]`
      : (this.constructor as typeof Constructed).NAME;

    return values.length
      ? `${blockName} :\n${values.join("\n")}` // items
      : `${blockName} :`; // empty
  }

}
