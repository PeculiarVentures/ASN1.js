import { LocalSimpleStringBlockParams, LocalSimpleStringBlock, LocalSimpleStringBlockJson } from "./internals/LocalSimpleStringBlock";
import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";

export type IA5StringParams = LocalSimpleStringBlockParams;
export type IA5StringJson = LocalSimpleStringBlockJson;

export class IA5String extends LocalSimpleStringBlock {

  static {
    typeStore.IA5String = this;
  }

  public static override NAME = "IA5String";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.IA5String};

  constructor(parameters: IA5StringParams = {}) {
    super(parameters);

    this.idBlock.tagClass = IA5String.defaultIDs.tagClass;
    this.idBlock.tagNumber = IA5String.defaultIDs.tagNumber;
  }

}
