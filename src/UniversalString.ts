import { LocalUniversalStringValueBlockParams, LocalUniversalStringValueBlock, LocalUniversalStringValueBlockJson } from "./internals/LocalUniversalStringValueBlockParams";
import { typeStore } from "./TypeStore";

export type UniversalStringParams = LocalUniversalStringValueBlockParams;
export type UniversalStringJson = LocalUniversalStringValueBlockJson;

export class UniversalString extends LocalUniversalStringValueBlock {

  static {
    typeStore.UniversalString = this;
  }

  public static override NAME = "UniversalString";

  constructor({
    ...parameters
  }: UniversalStringParams = {}) {
    super(parameters);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 28; // UniversalString
  }

}
