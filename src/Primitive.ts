import { BaseBlock, BaseBlockJson, BaseBlockParams } from "./BaseBlock";
import { LocalPrimitiveValueBlock, LocalPrimitiveValueBlockJson, LocalPrimitiveValueBlockParams } from "./internals/LocalPrimitiveValueBlock";
import { typeStore } from "./TypeStore";

export interface PrimitiveParams extends BaseBlockParams, LocalPrimitiveValueBlockParams { }
export type PrimitiveJson = BaseBlockJson<LocalPrimitiveValueBlockJson>;

export class Primitive extends BaseBlock<LocalPrimitiveValueBlock, LocalPrimitiveValueBlockJson> {

  static {
    typeStore.Primitive = this;
  }

  public static override NAME = "PRIMITIVE";

  constructor(parameters: PrimitiveParams = {}) {
    super(parameters, LocalPrimitiveValueBlock);

    this.idBlock.isConstructed = false;
  }

}
