import { LocalSimpleStringBlockParams, LocalSimpleStringBlock, LocalSimpleStringBlockJson } from "./internals/LocalSimpleStringBlock";
import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";

export type NumericStringParams = LocalSimpleStringBlockParams;
export type NumericStringJson = LocalSimpleStringBlockJson;

export class NumericString extends LocalSimpleStringBlock {

  static {
    typeStore.NumericString = this;
  }

  public static override NAME = "NumericString";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.NumericString};

  constructor(parameters: NumericStringParams = {}) {
    super(parameters);

    this.idBlock.tagClass = NumericString.defaultIDs.tagClass;
    this.idBlock.tagNumber = NumericString.defaultIDs.tagNumber;
  }

}
