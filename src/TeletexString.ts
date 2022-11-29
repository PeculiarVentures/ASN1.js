import { LocalSimpleStringBlockParams, LocalSimpleStringBlock, LocalSimpleStringBlockJson } from "./internals/LocalSimpleStringBlock";
import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";

export type TeletexStringParams = LocalSimpleStringBlockParams;
export type TeletexStringJson = LocalSimpleStringBlockJson;

export class TeletexString extends LocalSimpleStringBlock {

  static {
    typeStore.TeletexString = this;
  }

  public static override NAME = "TeletexString";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.TeletexString};

  constructor(parameters: TeletexStringParams = {}) {
    TeletexString.mergeIDBlock(parameters, TeletexString.defaultIDs);
    super(parameters);
  }

}
