import { BaseBlock, type BaseBlockJson, type BaseBlockParams } from "./BaseBlock";
import {
  type LocalRelativeObjectIdentifierValueBlockParams,
  LocalRelativeObjectIdentifierValueBlock,
  type LocalRelativeObjectIdentifierValueBlockJson,
} from "./internals/LocalRelativeObjectIdentifierValueBlock";
import { typeStore } from "./TypeStore";
import type { ViewWriter } from "./ViewWriter";

export interface RelativeObjectIdentifierParams extends BaseBlockParams, LocalRelativeObjectIdentifierValueBlockParams {}
export interface RelativeObjectIdentifierJson extends BaseBlockJson<LocalRelativeObjectIdentifierValueBlockJson> {
  value: string;
}

export class RelativeObjectIdentifier extends BaseBlock<LocalRelativeObjectIdentifierValueBlock, LocalRelativeObjectIdentifierValueBlockJson> {
  static {
    typeStore.RelativeObjectIdentifier = this;
  }

  /**
   * Gets string representation of Relative Object Identifier
   * @since 3.0.0
   */
  public getValue(): string {
    return this.valueBlock.toString();
  }

  /**
   * Sets Relative Object Identifier value from a complete decimal string.
   * Invalid input clears the value and sets `error` and `valueBlock.error` without throwing.
   * @param value String value
   * @since 3.0.0
   */
  public setValue(value: string): void {
    this.valueBlock.fromString(value);
    this.error = this.idBlock.error || this.lenBlock.error || this.valueBlock.error;
  }

  public static override NAME = "RelativeObjectIdentifier";

  constructor(parameters: RelativeObjectIdentifierParams = {}) {
    super(parameters, LocalRelativeObjectIdentifierValueBlock);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 13; // RELATIVE OBJECT IDENTIFIER
    this.error = this.idBlock.error || this.lenBlock.error || this.valueBlock.error;
  }

  /** Encodes the value and copies value errors to this block's diagnostics. */
  public override toBER(sizeOnly?: boolean, writer?: ViewWriter): ArrayBuffer {
    const encoded = super.toBER(sizeOnly, writer);
    this.error = this.idBlock.error || this.lenBlock.error || this.valueBlock.error;
    return encoded;
  }

  protected override onAsciiEncoding(): string {
    return `${(this.constructor as typeof RelativeObjectIdentifier).NAME} : ${this.valueBlock.toString() || "empty"}`;
  }

  public override toJSON(): RelativeObjectIdentifierJson {
    return {
      ...super.toJSON(),
      value: this.getValue(),
    };
  }
}
