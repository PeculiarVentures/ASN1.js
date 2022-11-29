import { LocalSimpleStringBlockParams, LocalSimpleStringBlock, LocalSimpleStringBlockJson } from "./internals/LocalSimpleStringBlock";
import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";

export type CharacterStringParams = LocalSimpleStringBlockParams;
export type CharacterStringJson = LocalSimpleStringBlockJson;

export class CharacterString extends LocalSimpleStringBlock {

  static {
    typeStore.CharacterString = this;
  }

  public static override NAME = "CharacterString";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.CharacterString};

  constructor(parameters: CharacterStringParams = {}) {
    CharacterString.mergeIDBlock(parameters, CharacterString.defaultIDs);
    super(parameters);
  }

}
