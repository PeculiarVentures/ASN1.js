import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";
import { Utf8StringParams, Utf8String, Utf8StringJson } from "./Utf8String";

export type TimeOfDayParams = Utf8StringParams;
export type TimeOfDayJson = Utf8StringJson;

export class TimeOfDay extends Utf8String {

  static {
    typeStore.TimeOfDay = this;
  }

  public static override NAME = "TimeOfDay";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.TimeOfDay};

  constructor(parameters: TimeOfDayParams = {}) {
    TimeOfDay.mergeIDBlock(parameters, TimeOfDay.defaultIDs);
    super(parameters);
  }

  /**
   * A typeguard that allows to validate if a certain asn1.js object is of our type
   */
  public static override typeGuard(obj: unknown | undefined): obj is TimeOfDay {
    return this.matches(obj);
  }

}
