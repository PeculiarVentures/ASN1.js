import { LocalSimpleStringBlockParams, LocalSimpleStringBlock, LocalSimpleStringBlockJson } from "./internals/LocalSimpleStringBlock";
import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";

export type GeneralStringParams = LocalSimpleStringBlockParams;
export type GeneralStringJson = LocalSimpleStringBlockJson;

export class GeneralString extends LocalSimpleStringBlock {

  static {
    typeStore.GeneralString = this;
  }

  public static override NAME = "GeneralString";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.GeneralString};

  constructor(parameters: GeneralStringParams = {}) {
    GeneralString.mergeIDBlock(parameters, GeneralString.defaultIDs);
    super(parameters);
  }

  /**
   * A typeguard that allows to validate if a certain asn1.js object is of our type
   */
  public static typeGuard(obj: unknown | undefined): obj is GeneralString {
    return this.matches(obj);
  }

}
