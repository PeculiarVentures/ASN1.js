import { LocalBmpStringValueBlockParams, LocalBmpStringValueBlock, LocalBmpStringValueBlockJson } from "./internals/LocalBmpStringValueBlock";
import { IBaseIDs } from "./internals/LocalIdentificationBlock";
import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";

export type BmpStringParams = LocalBmpStringValueBlockParams;
export type BmpStringJson = LocalBmpStringValueBlockJson;

export class BmpString extends LocalBmpStringValueBlock {

  static {
    typeStore.BmpString = this;
  }
  public static override NAME = "BMPString";
  public static override defaultIDs: IBaseIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.BmpString};

  constructor(parameters: BmpStringParams = {}) {
    BmpString.mergeIDBlock(parameters, BmpString.defaultIDs);
    super(parameters);
  }

  /**
   * A typeguard that allows to validate if a certain asn1.js object is of our type
   */
  public static typeGuard(obj: unknown | undefined): obj is BmpString {
    return this.matches(obj);
  }

}
