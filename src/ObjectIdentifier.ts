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
   * Whether value assignment and encoding throw on invalid OIDs. Defaults to `false`.
   * Changing this flag does not validate or alter the value; the next assignment or encoding checks it.
   */
  public get strict(): boolean {
    return this.valueBlock.strict;
  }

  public set strict(value: boolean) {
    this.valueBlock.strict = value;
  }

  /**
   * Gets string representation of Object Identifier
   * @since 3.0.0
   */
  public getValue(): string {
    return this.valueBlock.toString();
  }

  /**
   * Sets Object Identifier value from a complete decimal string.
   * Invalid input clears the value and sets `error` and `valueBlock.error`.
   * Throws when `strict` is enabled; a successful assignment clears previous value errors.
   * @param value String value
   * @since 3.0.0
   */
  public setValue(value: string): void {
    try {
      this.valueBlock.fromString(value);
    } finally {
      this.error = this.idBlock.error || this.lenBlock.error || this.valueBlock.error;
    }
  }

  constructor(parameters: ObjectIdentifierParams = {}) {
    super(parameters, LocalObjectIdentifierValueBlock);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 6; // OBJECT IDENTIFIER
    this.error = this.idBlock.error || this.lenBlock.error || this.valueBlock.error;
  }

  /**
   * Encodes the value and copies value errors to this block's diagnostics.
   * In strict mode, invalid values throw, including for `sizeOnly` and nested encoding.
   * Discard an externally supplied writer if encoding throws; writes are not rolled back.
   */
  public override toBER(sizeOnly?: boolean, writer?: ViewWriter): ArrayBuffer {
    try {
      return super.toBER(sizeOnly, writer);
    } finally {
      this.error = this.idBlock.error || this.lenBlock.error || this.valueBlock.error;
    }
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
