import { LocalSimpleStringBlockParams, LocalSimpleStringBlock } from "./internals/LocalSimpleStringBlock";
import { typeStore } from "./TypeStore";

export type TeletexStringParams = LocalSimpleStringBlockParams;

export class TeletexString extends LocalSimpleStringBlock {

  static {
    typeStore.TeletexString = this;
  }

  public static override NAME = "TeletexString";

  constructor(parameters = {}) {
    super(parameters);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 20; // TeletexString
  }

}
