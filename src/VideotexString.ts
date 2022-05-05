import { LocalSimpleStringBlockParams, LocalSimpleStringBlock, LocalSimpleStringBlockJson } from "./internals/LocalSimpleStringBlock";
import { typeStore } from "./TypeStore";

export type VideotexStringParams = LocalSimpleStringBlockParams;
export type VideotexStringJson = LocalSimpleStringBlockJson;

export class VideotexString extends LocalSimpleStringBlock {

  static {
    typeStore.VideotexString = this;
  }

  public static override NAME = "VideotexString";

  constructor(parameters: VideotexStringParams = {}) {
    super(parameters);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 21; // VideotexString
  }

}
