import { ConstructedParams, Constructed, ConstructedJson } from "./Constructed";
import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";

export type SetParams = ConstructedParams;
export type SetJson = ConstructedJson;

export class Set extends Constructed {

  static {
    typeStore.Set = this;
  }

  public static override NAME = "SET";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.Set};

  constructor(parameters: SetParams = {}) {
    Set.mergeIDBlock(parameters, Set.defaultIDs);
    super(parameters);
  }

  /**
   * A typeguard that allows to validate if a certain asn1.js object is of our type
   */
  public static typeGuard(obj: unknown | undefined): obj is Set {
    return this.matches(obj);
  }

}
