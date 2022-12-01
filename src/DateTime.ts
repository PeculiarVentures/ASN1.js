import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";
import { Utf8StringParams, Utf8String, Utf8StringJson } from "./Utf8String";

export type DateTimeParams = Utf8StringParams;
export type DateTimeJson = Utf8StringJson;

export class DateTime extends Utf8String {

  static {
    typeStore.DateTime = this;
  }

  public static override NAME = "DateTime";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.DateTime};

  constructor(parameters: DateTimeParams = {}) {
    DateTime.mergeIDBlock(parameters, DateTime.defaultIDs);
    super(parameters);
  }

  /**
   * A typeguard that allows to validate if a certain asn1.js object is of our type
   */
  public static override typeGuard(obj: unknown | undefined): obj is DateTime {
    return this.matches(obj);
  }

}
