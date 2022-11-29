import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";
import { Utf8StringParams, Utf8String, Utf8StringJson } from "./Utf8String";

export type DurationParams = Utf8StringParams;
export type DurationJson = Utf8StringJson;

export class Duration extends Utf8String {

  static {
    typeStore.Duration = this;
  }
  public static override NAME = "Duration";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.Duration};

  constructor(parameters: DurationParams = {}) {
    Duration.mergeIDBlock(parameters, Duration.defaultIDs);
    super(parameters);
  }

}
