import { IntegerParams, Integer } from "./Integer";
import { typeStore } from "./TypeStore";

export type EnumeratedParams = IntegerParams;

export class Enumerated extends Integer {

  static {
    typeStore.Enumerated = this;
  }

  public static override NAME = "ENUMERATED";

  constructor(parameters: EnumeratedParams = {}) {
    super(parameters);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 10; // Enumerated
  }

}
