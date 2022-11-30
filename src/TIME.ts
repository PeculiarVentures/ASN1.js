import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";
import { Utf8StringParams, Utf8String, Utf8StringJson } from "./Utf8String";

export type TIMEParams = Utf8StringParams;
export type TIMEJson = Utf8StringJson;

export class TIME extends Utf8String {

  static {
    typeStore.TIME = this;
  }

  public static override NAME = "TIME";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.TIME};

  constructor(parameters: TIMEParams = {}) {
    TIME.mergeIDBlock(parameters, TIME.defaultIDs);
    super(parameters);
  }

  /**
   * A typeguard that allows to validate if a certain asn1.js object is of our type
   */
  public static override typeGuard(obj: unknown | undefined): obj is TIME {
    return this.matches(obj);
  }

}
