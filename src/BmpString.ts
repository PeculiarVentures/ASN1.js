import { LocalBmpStringValueBlockParams, LocalBmpStringValueBlock, LocalBmpStringValueBlockJson } from "./internals/LocalBmpStringValueBlock";
import { typeStore } from "./TypeStore";

export type BmpStringParams = LocalBmpStringValueBlockParams;
export type BmpStringJson = LocalBmpStringValueBlockJson;

export class BmpString extends LocalBmpStringValueBlock {

  static {
    typeStore.BmpString = this;
  }
  public static override NAME = "BMPString";

  constructor({
    ...parameters
  }: BmpStringParams = {}) {
    super(parameters);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 30; // BmpString
  }

}
