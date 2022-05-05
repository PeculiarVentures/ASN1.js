import { ConstructedParams, Constructed, ConstructedJson } from "./Constructed";
import { typeStore } from "./TypeStore";

export type SequenceParams = ConstructedParams;
export type SequenceJson = ConstructedJson;

export class Sequence extends Constructed {

  static {
    typeStore.Sequence = this;
  }

  public static override NAME = "SEQUENCE";

  constructor(parameters: SequenceParams = {}) {
    super(parameters);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 16; // Sequence
  }

}
