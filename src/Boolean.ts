import { BaseBlock, BaseBlockParams } from "./BaseBlock";
import { LocalBooleanValueBlockParams, LocalBooleanValueBlock } from "./internals/LocalBooleanValueBlock";
import { typeStore } from "./TypeStore";

export interface BooleanParams extends BaseBlockParams, LocalBooleanValueBlockParams { }

export class Boolean extends BaseBlock<LocalBooleanValueBlock> {

  static {
    typeStore.Boolean = this;
  }

  public static override NAME = "BOOLEAN";

  constructor(parameters: BooleanParams = {}) {
    super(parameters, LocalBooleanValueBlock);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 1; // Boolean
  }

  public override toString(): string {
    return `${(this.constructor as typeof Boolean).NAME} : ${this.valueBlock.value}`;
  }

}
