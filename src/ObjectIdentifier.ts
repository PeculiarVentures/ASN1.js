import { BaseBlock, type BaseBlockJson, type BaseBlockParams } from "./BaseBlock";
import { type LocalObjectIdentifierValueBlockParams, LocalObjectIdentifierValueBlock, type LocalObjectIdentifierValueBlockJson } from "./internals/LocalObjectIdentifierValueBlock";
import { typeStore } from "./TypeStore";
import type { ViewWriter } from "./ViewWriter";

export interface ObjectIdentifierParams extends BaseBlockParams, LocalObjectIdentifierValueBlockParams {}
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
   * Sets Object Identifier value from a complete decimal string.
   * Invalid input clears the value and sets `error` and `valueBlock.error` without throwing.
   * @param value String value
   * @since 3.0.0
   */
  public setValue(value: string): void {
    this.valueBlock.fromString(value);
    this.error = this.idBlock.error || this.lenBlock.error || this.valueBlock.error;
  }

  constructor(parameters: ObjectIdentifierParams = {}) {
    super(parameters, LocalObjectIdentifierValueBlock);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 6; // OBJECT IDENTIFIER
    this.error = this.idBlock.error || this.lenBlock.error || this.valueBlock.error;
  }

  /** Encodes the value and copies value errors to this block's diagnostics. */
  public override toBER(sizeOnly?: boolean, writer?: ViewWriter): ArrayBuffer {
    const encoded = super.toBER(sizeOnly, writer);
    this.error = this.idBlock.error || this.lenBlock.error || this.valueBlock.error;
    return encoded;
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
