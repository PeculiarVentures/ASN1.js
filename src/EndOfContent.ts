import { BaseBlock, BaseBlockJson, BaseBlockParams } from "./BaseBlock";
import { END_OF_CONTENT_NAME } from "./internals/constants";
import { LocalEndOfContentValueBlock } from "./internals/LocalEndOfContentValueBlock";
import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";

export type EndOfContentParams = BaseBlockParams;
export type EndOfContentJson = BaseBlockJson;

export class EndOfContent extends BaseBlock<LocalEndOfContentValueBlock> {

  static {
    typeStore.EndOfContent = this;
  }
  public static override NAME = END_OF_CONTENT_NAME;
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.EndOfContent};

  constructor(parameters: EndOfContentParams = {}) {
    EndOfContent.mergeIDBlock(parameters, EndOfContent.defaultIDs);
    super(parameters, LocalEndOfContentValueBlock);
  }

  public getValue(): null {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public setValue(value: number): void {
  }

  /**
   * A typeguard that allows to validate if a certain asn1.js object is of our type
   */
  public static typeGuard(obj: unknown | undefined): obj is EndOfContent {
    return this.matches(obj);
  }

}
