import { BaseBlock, BaseBlockJson, BaseBlockParams } from "./BaseBlock";
import { LocalObjectIdentifierValueBlockParams, LocalObjectIdentifierValueBlock, LocalObjectIdentifierValueBlockJson } from "./internals/LocalObjectIdentifierValueBlock";
import { typeStore } from "./TypeStore";

export interface ObjectIdentifierParams extends BaseBlockParams, LocalObjectIdentifierValueBlockParams { }
export interface ObjectIdentifierJson extends BaseBlockJson<LocalObjectIdentifierValueBlockJson> {
  value: string;
}

export class ObjectIdentifier extends BaseBlock<LocalObjectIdentifierValueBlock, LocalObjectIdentifierValueBlockJson> {

  static {
    typeStore.ObjectIdentifier = this;
  }

  public static override NAME = "OBJECT IDENTIFIER";

  /**
   * Gets string representation of Object Identifier
   * @since 3.0.0
   */
  public getValue(): string {
    return this.valueBlock.toString();
  }

  /**
   * Sets Object Identifier value from string
   * @param value String value
   * @since 3.0.0
   */
  public setValue(value: string): void {
    this.valueBlock.fromString(value);
  }

  constructor(parameters: ObjectIdentifierParams = {}) {
    super(parameters, LocalObjectIdentifierValueBlock);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 6; // OBJECT IDENTIFIER
  }

  protected override onAsciiEncoding(): string {
    return `${(this.constructor as typeof ObjectIdentifier).NAME} : ${this.valueBlock.toString() || "empty"}`;
  }

  public override toJSON(): ObjectIdentifierJson {
    return {
      ...super.toJSON(),
      value: this.getValue(),
    };
  }

}
