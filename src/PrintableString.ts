import { LocalSimpleStringBlockParams, LocalSimpleStringBlock, LocalSimpleStringBlockJson } from "./internals/LocalSimpleStringBlock";
import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";

export type PrintableStringParams = LocalSimpleStringBlockParams;
export type PrintableStringJson = LocalSimpleStringBlockJson;

export class PrintableString extends LocalSimpleStringBlock {

  static {
    typeStore.PrintableString = this;
  }

  public static override NAME = "PrintableString";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.PrintableString};

  constructor(parameters: PrintableStringParams = {}) {
    PrintableString.mergeIDBlock(parameters, PrintableString.defaultIDs);
    super(parameters);
  }

  /**
   * A typeguard that allows to validate if a certain asn1.js object is of our type
   */
  public static typeGuard(obj: unknown | undefined): obj is PrintableString {
    return this.matches(obj);
  }

}
