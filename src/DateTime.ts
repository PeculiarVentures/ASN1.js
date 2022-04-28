import { typeStore } from "./TypeStore";
import { Utf8StringParams, Utf8String } from "./Utf8String";

export type DateTimeParams = Utf8StringParams;

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
