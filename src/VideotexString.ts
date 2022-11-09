import { LocalSimpleStringBlockParams, LocalSimpleStringBlock, LocalSimpleStringBlockJson } from "./internals/LocalSimpleStringBlock";
import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";

export type VideotexStringParams = LocalSimpleStringBlockParams;
export type VideotexStringJson = LocalSimpleStringBlockJson;

export class VideotexString extends LocalSimpleStringBlock {

  static {
    typeStore.VideotexString = this;
  }

  public static override NAME = "VideotexString";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.VideotexString};

  constructor(parameters: VideotexStringParams = {}) {
    super(parameters);

    this.idBlock.tagClass = VideotexString.defaultIDs.tagClass;
    this.idBlock.tagNumber = VideotexString.defaultIDs.tagNumber;
  }

}
