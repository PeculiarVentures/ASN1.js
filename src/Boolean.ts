import { BaseBlock, BaseBlockJson, BaseBlockParams } from "./BaseBlock";
import { LocalBooleanValueBlockParams, LocalBooleanValueBlock, LocalBooleanValueBlockJson } from "./internals/LocalBooleanValueBlock";
import { IBaseIDs } from "./internals/LocalIdentificationBlock";
import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";

export interface BooleanParams extends BaseBlockParams, LocalBooleanValueBlockParams { }
export type BooleanJson = BaseBlockJson<LocalBooleanValueBlockJson>;

export class Boolean extends BaseBlock<LocalBooleanValueBlock, LocalBooleanValueBlockJson> {

  static {
    typeStore.Boolean = this;
  }

  /**
   * Gets value
   * @since 3.0.0
   */
  public getValue(): boolean {
    return this.valueBlock.value;
  }
  /**
   * Sets value
   * @param value Boolean value
   * @since 3.0.0
   */
  public setValue(value: boolean): void {
    this.valueBlock.value = value;
  }

  public static override NAME = "BOOLEAN";
  public static override defaultIDs: IBaseIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.Boolean};

  constructor(parameters: BooleanParams = {}) {
    Boolean.mergeIDBlock(parameters, Boolean.defaultIDs);
    super(parameters, LocalBooleanValueBlock);
  }

  protected override onAsciiEncoding(): string {
    return `${(this.constructor as typeof Boolean).NAME} : ${this.getValue}`;
  }

}
