import { LocalSimpleStringBlockParams, LocalSimpleStringBlock, LocalSimpleStringBlockJson } from "./internals/LocalSimpleStringBlock";
import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";

export type GraphicStringParams = LocalSimpleStringBlockParams;
export type GraphicStringJson = LocalSimpleStringBlockJson;

export class GraphicString extends LocalSimpleStringBlock {

  static {
    typeStore.GraphicString = this;
  }

  public static override NAME = "GraphicString";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.GraphicString};

  constructor(parameters: GraphicStringParams = {}) {
    GraphicString.mergeIDBlock(parameters, GraphicString.defaultIDs);
    super(parameters);
  }

}
