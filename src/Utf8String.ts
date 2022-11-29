import { BaseBlockJson } from "./BaseBlock";
import { BaseStringBlockParams } from "./BaseStringBlock";
import { LocalUtf8StringValueBlockParams, LocalUtf8StringValueBlock, LocalUtf8StringValueBlockJson } from "./internals/LocalUtf8StringValueBlock";
import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";

export interface Utf8StringParams extends BaseStringBlockParams, LocalUtf8StringValueBlockParams { }
export type Utf8StringJson = BaseBlockJson<LocalUtf8StringValueBlockJson>;

export class Utf8String extends LocalUtf8StringValueBlock {

  static {
    typeStore.Utf8String = this;
  }

  public static override NAME = "UTF8String";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.Utf8String};

  constructor(parameters: Utf8StringParams = {}) {
    Utf8String.mergeIDBlock(parameters, Utf8String.defaultIDs);
    super(parameters);
  }

}
