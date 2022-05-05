import { typeStore } from "./TypeStore";
import { Utf8StringParams, Utf8String, Utf8StringJson } from "./Utf8String";

export type TIMEParams = Utf8StringParams;
export type TIMEJson = Utf8StringJson;

export class TIME extends Utf8String {

  static {
    typeStore.TIME = this;
  }

  public static override NAME = "TIME";

  constructor(parameters: TIMEParams = {}) {
    super(parameters);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 14; // Time
  }

}
