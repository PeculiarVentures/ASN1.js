import { typeStore } from "./TypeStore";
import { Utf8StringParams, Utf8String, Utf8StringJson } from "./Utf8String";

export type DurationParams = Utf8StringParams;
export type DurationJson = Utf8StringJson;

export class Duration extends Utf8String {

  static {
    typeStore.Duration = this;
  }
  public static override NAME = "Duration";

  constructor(parameters: DurationParams = {}) {
    super(parameters);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 34; // Duration
  }

}
