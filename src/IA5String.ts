import { LocalSimpleStringBlockParams, LocalSimpleStringBlock } from "./internals/LocalSimpleStringBlock";
import { typeStore } from "./TypeStore";

export type IA5StringParams = LocalSimpleStringBlockParams;

export class IA5String extends LocalSimpleStringBlock {

  static {
    typeStore.IA5String = this;
  }

  public static override NAME = "IA5String";

  constructor(parameters: IA5StringParams = {}) {
    super(parameters);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 22; // IA5String
  }

}
