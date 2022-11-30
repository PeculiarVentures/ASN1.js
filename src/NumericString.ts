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
    NumericString.mergeIDBlock(parameters, NumericString.defaultIDs);
    super(parameters);
  }

  /**
   * A typeguard that allows to validate if a certain asn1.js object is of our type
   */
  public static typeGuard(obj: unknown | undefined): obj is NumericString {
    return this.matches(obj);
  }

}
