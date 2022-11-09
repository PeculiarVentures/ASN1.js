import { LocalSimpleStringBlockParams, LocalSimpleStringBlock, LocalSimpleStringBlockJson } from "./internals/LocalSimpleStringBlock";
import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";

export type GeneralStringParams = LocalSimpleStringBlockParams;
export type GeneralStringJson = LocalSimpleStringBlockJson;

export class GeneralString extends LocalSimpleStringBlock {

  static {
    typeStore.GeneralString = this;
  }

  public static override NAME = "GeneralString";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.GeneralString};

  constructor(parameters: GeneralStringParams = {}) {
    super(parameters);

    this.idBlock.tagClass = GeneralString.defaultIDs.tagClass;
    this.idBlock.tagNumber = GeneralString.defaultIDs.tagNumber;
  }

}
