import { BaseBlock, BaseBlockParams } from "./BaseBlock";
import { LocalPrimitiveValueBlock } from "./internals/LocalPrimitiveValueBlock";
import { typeStore } from "./TypeStore";


export class Primitive extends BaseBlock {

  static {
    typeStore.Primitive = this;
  }

  public static override NAME = "PRIMITIVE";

  constructor(parameters: BaseBlockParams = {}) {
    super(parameters, LocalPrimitiveValueBlock);

    this.idBlock.isConstructed = false;
  }

}
