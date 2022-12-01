import { IntegerParams, Integer, IntegerJson } from "./Integer";
import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";

export type EnumeratedParams = IntegerParams;
export type EnumeratedJson = IntegerJson;

export class Enumerated extends Integer {

  static {
    typeStore.Enumerated = this;
  }

  public static override NAME = "ENUMERATED";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.Enumerated};

  constructor(parameters: EnumeratedParams = {}) {
    Enumerated.mergeIDBlock(parameters, Enumerated.defaultIDs);
    super(parameters);
  }

  /**
   * A typeguard that allows to validate if a certain asn1.js object is of our type
   */
  public static override typeGuard(obj: unknown | undefined): obj is Enumerated {
    return this.matches(obj);
  }

}
