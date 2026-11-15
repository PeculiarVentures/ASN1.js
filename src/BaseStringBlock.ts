import { BaseBlock, type BaseBlockParams } from "./BaseBlock";
import type { IStringConvertible } from "./types";
import { EMPTY_STRING } from "./internals/constants";
import type { LocalStringValueBlock, LocalStringValueBlockJson, LocalStringValueBlockParams } from "./internals/LocalStringValueBlock";
import type { FromBerContext } from "./parser";
import { checkPrimitiveEncoding } from "./der";
import { report } from "./internals/der";

export interface BaseStringBlockParams extends BaseBlockParams, LocalStringValueBlockParams {}
export type BaseStringBlockJson = LocalStringValueBlockJson;

// eslint-disable-next-line @stylistic/max-len
export abstract class BaseStringBlock<T extends LocalStringValueBlock = LocalStringValueBlock, J extends BaseStringBlockJson = BaseStringBlockJson>
  extends BaseBlock<T, J>
  implements IStringConvertible
{
  public static override NAME = "BaseStringBlock";

  /**
   * String value
   * @since 3.0.0
   */
  public getValue(): string {
    return this.valueBlock.value;
  }

  /**
   * String value
   * @param value String value
   * @since 3.0.0
   */
  public setValue(value: string): void {
    this.valueBlock.value = value;
  }

  constructor({ value = EMPTY_STRING, ...parameters }: BaseStringBlockParams = {}, stringValueBlockType: new () => T) {
    super(parameters, stringValueBlockType);

    if (value) {
      this.fromString(value);
    }
  }

  public override fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number, context?: FromBerContext): number {
    const resultOffset = this.valueBlock.fromBER(inputBuffer, inputOffset, this.lenBlock.isIndefiniteForm ? inputLength : this.lenBlock.length, context);
    if (resultOffset === -1) {
      this.error = this.valueBlock.error;

      return resultOffset;
    }

    const valueError = this.checkValue(this.valueBlock.valueHexView, context);
    if (valueError) {
      this.error = valueError;

      return -1;
    }

    this.fromBufferForBER(this.valueBlock.valueHexView);
    if (this.error) {
      return -1;
    }

    if (!this.idBlock.error.length) this.blockLength += this.idBlock.blockLength;

    if (!this.lenBlock.error.length) this.blockLength += this.lenBlock.blockLength;

    if (!this.valueBlock.error.length) this.blockLength += this.valueBlock.blockLength;

    return resultOffset;
  }

  /**
   * Validates the raw value bytes before they are decoded
   * @param view Value bytes read from BER
   * @param context Parser state, including the requested encoding rules
   * @returns Error message, or an empty string if the value is valid
   */
  protected checkValue(view: Uint8Array, context?: FromBerContext): string {
    if (context?.encodingRules === "DER") {
      const issue = checkPrimitiveEncoding(this.idBlock.tagNumber, this.idBlock.isConstructed, view);
      if (issue) return report(context, issue);
    }

    return EMPTY_STRING;
  }

  /**
   * Decodes value bytes read from BER
   */
  protected fromBufferForBER(view: Uint8Array): void {
    this.fromBuffer(view);
  }

  /**
   * Function converting ArrayBuffer into ASN.1 internal string
   * @param inputBuffer ASN.1 BER encoded array
   */
  public abstract fromBuffer(inputBuffer: ArrayBuffer | Uint8Array): void;

  public abstract fromString(inputString: string): void;

  protected override onAsciiEncoding(): string {
    return `${(this.constructor as typeof BaseStringBlock).NAME} : '${this.valueBlock.value}'`;
  }
}
