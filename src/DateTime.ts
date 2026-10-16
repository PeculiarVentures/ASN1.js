import { typeStore } from "./TypeStore";
import { type Utf8StringParams, Utf8String, type Utf8StringJson } from "./Utf8String";

export type DateTimeParams = Utf8StringParams;
export type DateTimeJson = Utf8StringJson;

export class DateTime extends Utf8String {
  static {
    typeStore.DateTime = this;
  }

  public static override NAME = "DateTime";

  constructor(parameters: DateTimeParams = {}) {
    super(parameters);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 33; // DateTime
  }
}
