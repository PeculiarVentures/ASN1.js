import { BaseBlock, type BaseBlockJson, type BaseBlockParams } from "./BaseBlock";
import {
  type LocalRelativeObjectIdentifierValueBlockParams,
  LocalRelativeObjectIdentifierValueBlock,
  type LocalRelativeObjectIdentifierValueBlockJson,
} from "./internals/LocalRelativeObjectIdentifierValueBlock";
import { syncOidError } from "./internals/oidUtils";
import { typeStore } from "./TypeStore";
import type { ViewWriter } from "./ViewWriter";
import type { FromBerContext } from "./parser";

export interface RelativeObjectIdentifierParams extends BaseBlockParams, LocalRelativeObjectIdentifierValueBlockParams {}
export interface RelativeObjectIdentifierJson extends BaseBlockJson<LocalRelativeObjectIdentifierValueBlockJson> {
  value: string;
}

export class RelativeObjectIdentifier extends BaseBlock<LocalRelativeObjectIdentifierValueBlock, LocalRelativeObjectIdentifierValueBlockJson> {
  static {
    typeStore.RelativeObjectIdentifier = this;
  }

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
   * Gets string representation of Relative Object Identifier
   * @since 3.0.0
   */
  public getValue(): string {
    return this.valueBlock.toString();
  }

  /**
   * Sets Relative Object Identifier value from a complete decimal string.
   * Invalid input clears the value and sets `error` and `valueBlock.error`.
   * Throws when `strict` is enabled; a successful assignment clears previous value errors.
   * @param value String value
   * @since 3.0.0
   */
  public setValue(value: string): void {
    try {
      this.valueBlock.fromString(value);
    } finally {
      syncOidError(this);
    }
  }

  public static override NAME = "RelativeObjectIdentifier";

  constructor(parameters: RelativeObjectIdentifierParams = {}) {
    super(parameters, LocalRelativeObjectIdentifierValueBlock);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 13; // RELATIVE OBJECT IDENTIFIER
    syncOidError(this);
  }

  /** Replaces decoded value state and refreshes diagnostics using the prepared length block. */
  public override fromBER(inputBuffer: Uint8Array, inputOffset: number, inputLength: number, context?: FromBerContext): number {
    this.blockLength = 0;
    try {
      return super.fromBER(inputBuffer, inputOffset, inputLength, context);
    } finally {
      syncOidError(this);
    }
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
      syncOidError(this);
    }
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
