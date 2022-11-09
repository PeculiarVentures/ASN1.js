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
    super(parameters);

    this.idBlock.tagClass = TimeOfDay.defaultIDs.tagClass;
    this.idBlock.tagNumber = TimeOfDay.defaultIDs.tagNumber;
  }

}
