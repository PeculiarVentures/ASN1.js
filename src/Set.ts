import { ConstructedParams, Constructed, ConstructedJson } from "./Constructed";
import { typeStore } from "./TypeStore";

export type SetParams = ConstructedParams;
export type SetJson = ConstructedJson;

export class Set extends Constructed {

  static {
    typeStore.Set = this;
  }

  public static override NAME = "SET";

  constructor(parameters: SetParams = {}) {
    super(parameters);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 17; // Set
  }

}
