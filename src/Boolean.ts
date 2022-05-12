import { BaseBlock, BaseBlockJson, BaseBlockParams } from "./BaseBlock";
import { LocalBooleanValueBlockParams, LocalBooleanValueBlock, LocalBooleanValueBlockJson } from "./internals/LocalBooleanValueBlock";
import { typeStore } from "./TypeStore";

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

  constructor(parameters: BooleanParams = {}) {
    super(parameters, LocalBooleanValueBlock);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 1; // Boolean
  }

  protected override onAsciiEncoding(): string {
    return `${(this.constructor as typeof Boolean).NAME} : ${this.getValue}`;
  }

}
