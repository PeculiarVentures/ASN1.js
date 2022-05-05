import { LocalSimpleStringBlockParams, LocalSimpleStringBlock, LocalSimpleStringBlockJson } from "./internals/LocalSimpleStringBlock";
import { typeStore } from "./TypeStore";

export type NumericStringParams = LocalSimpleStringBlockParams;
export type NumericStringJson = LocalSimpleStringBlockJson;

export class NumericString extends LocalSimpleStringBlock {

  static {
    typeStore.NumericString = this;
  }

  public static override NAME = "NumericString";

  constructor(parameters: NumericStringParams = {}) {
    super(parameters);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 18; // NumericString
  }

}
