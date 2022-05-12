import { typeStore } from "./TypeStore";
import { Utf8StringParams, Utf8String, Utf8StringJson } from "./Utf8String";

export type TimeOfDayParams = Utf8StringParams;
export type TimeOfDayJson = Utf8StringJson;

export class TimeOfDay extends Utf8String {

  static {
    typeStore.TimeOfDay = this;
  }

  public static override NAME = "TimeOfDay";

  constructor(parameters: TimeOfDayParams = {}) {
    super(parameters);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 32; // TimeOfDay
  }

}
