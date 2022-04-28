import { LocalSimpleStringBlockParams, LocalSimpleStringBlock } from "./internals/LocalSimpleStringBlock";
import { typeStore } from "./TypeStore";

export type VisibleStringParams = LocalSimpleStringBlockParams;

export class VisibleString extends LocalSimpleStringBlock {

  static {
    typeStore.VisibleString = this;
  }

  public static override NAME = "VisibleString";

  constructor(parameters: VisibleStringParams = {}) {
    super(parameters);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 26; // VisibleString
  }

}
