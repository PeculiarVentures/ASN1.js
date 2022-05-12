import { LocalSimpleStringBlockParams, LocalSimpleStringBlock, LocalSimpleStringBlockJson } from "./internals/LocalSimpleStringBlock";
import { typeStore } from "./TypeStore";

export type TeletexStringParams = LocalSimpleStringBlockParams;
export type TeletexStringJson = LocalSimpleStringBlockJson;

export class TeletexString extends LocalSimpleStringBlock {

  static {
    typeStore.TeletexString = this;
  }

  public static override NAME = "TeletexString";

  constructor(parameters: TeletexStringParams = {}) {
    super(parameters);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 20; // TeletexString
  }

}
