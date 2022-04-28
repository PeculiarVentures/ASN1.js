import { typeStore } from "./TypeStore";
import { Utf8StringParams, Utf8String } from "./Utf8String";

export type DATEParams = Utf8StringParams;

export class DATE extends Utf8String {

  static {
    typeStore.DATE = this;
  }

  public static override NAME = "DATE";

  constructor(parameters: DATEParams = {}) {
    super(parameters);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 31; // DATE
  }

}
