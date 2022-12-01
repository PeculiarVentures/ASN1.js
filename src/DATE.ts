import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";
import { Utf8StringParams, Utf8String, Utf8StringJson } from "./Utf8String";

export type DATEParams = Utf8StringParams;
export type DATEJson = Utf8StringJson;

export class DATE extends Utf8String {

  static {
    typeStore.DATE = this;
  }

  public static override NAME = "DATE";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.DATE};

  constructor(parameters: DATEParams = {}) {
    DATE.mergeIDBlock(parameters, DATE.defaultIDs);
    super(parameters);
  }

  /**
   * A typeguard that allows to validate if a certain asn1.js object is of our type
   */
  public static override typeGuard(obj: unknown | undefined): obj is DATE {
    return this.matches(obj);
  }

}
