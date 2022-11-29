import { LocalUniversalStringValueBlockParams, LocalUniversalStringValueBlock, LocalUniversalStringValueBlockJson } from "./internals/LocalUniversalStringValueBlockParams";
import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";

export type UniversalStringParams = LocalUniversalStringValueBlockParams;
export type UniversalStringJson = LocalUniversalStringValueBlockJson;

export class UniversalString extends LocalUniversalStringValueBlock {

  static {
    typeStore.UniversalString = this;
  }

  public static override NAME = "UniversalString";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.UniversalString};

  constructor(parameters: UniversalStringParams = {}) {
    UniversalString.mergeIDBlock(parameters, UniversalString.defaultIDs);
    super(parameters);
  }

}
