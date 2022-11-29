import { ConstructedParams, Constructed, ConstructedJson } from "./Constructed";
import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";

export type SequenceParams = ConstructedParams;
export type SequenceJson = ConstructedJson;

export class Sequence extends Constructed {

  static {
    typeStore.Sequence = this;
  }

  public static override NAME = "SEQUENCE";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.Sequence};

  constructor(parameters: SequenceParams = {}) {
    Sequence.mergeIDBlock(parameters, Sequence.defaultIDs);
    super(parameters);
  }

}
