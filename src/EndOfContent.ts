import { BaseBlock, BaseBlockJson, BaseBlockParams } from "./BaseBlock";
import { END_OF_CONTENT_NAME } from "./internals/constants";
import { LocalEndOfContentValueBlock } from "./internals/LocalEndOfContentValueBlock";
import { typeStore } from "./TypeStore";

export type EndOfContentParams = BaseBlockParams;
export type EndOfContentJson = BaseBlockJson;

export class EndOfContent extends BaseBlock<LocalEndOfContentValueBlock> {

  static {
    typeStore.EndOfContent = this;
  }
  public static override NAME = END_OF_CONTENT_NAME;

  constructor(parameters: EndOfContentParams = {}) {
    super(parameters, LocalEndOfContentValueBlock);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 0; // EndOfContent
  }

}
