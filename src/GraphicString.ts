import { LocalSimpleStringBlockParams, LocalSimpleStringBlock, LocalSimpleStringBlockJson } from "./internals/LocalSimpleStringBlock";
import { typeStore } from "./TypeStore";

export type GraphicStringParams = LocalSimpleStringBlockParams;
export type GraphicStringJson = LocalSimpleStringBlockJson;

export class GraphicString extends LocalSimpleStringBlock {

  static {
    typeStore.GraphicString = this;
  }

  public static override NAME = "GraphicString";

  constructor(parameters: GraphicStringParams = {}) {
    super(parameters);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 25; // GraphicString
  }

}
