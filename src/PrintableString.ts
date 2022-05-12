import { LocalSimpleStringBlockParams, LocalSimpleStringBlock, LocalSimpleStringBlockJson } from "./internals/LocalSimpleStringBlock";
import { typeStore } from "./TypeStore";

export type PrintableStringParams = LocalSimpleStringBlockParams;
export type PrintableStringJson = LocalSimpleStringBlockJson;

export class PrintableString extends LocalSimpleStringBlock {

  static {
    typeStore.PrintableString = this;
  }

  public static override NAME = "PrintableString";

  constructor(parameters: PrintableStringParams = {}) {
    super(parameters);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 19; // PrintableString
  }

}
