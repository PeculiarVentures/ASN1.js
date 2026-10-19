import { BaseBlock, BaseBlockParams } from "./BaseBlock";
import { IStringConvertible } from "./types";
import { EMPTY_STRING } from "./internals/constants";
import { LocalStringValueBlock, LocalStringValueBlockJson, LocalStringValueBlockParams } from "./internals/LocalStringValueBlock";

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

  public override fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
    const resultOffset = this.valueBlock.fromBER(inputBuffer, inputOffset, this.lenBlock.isIndefiniteForm ? inputLength : this.lenBlock.length);
    if (resultOffset === -1) {
      this.error = this.valueBlock.error;

      return resultOffset;
    }

    const valueError = this.checkValue(this.valueBlock.valueHexView);
    if (valueError) {
      this.error = valueError;

      return -1;
    }

    this.fromBuffer(this.valueBlock.valueHexView);

    if (!this.idBlock.error.length) this.blockLength += this.idBlock.blockLength;

    if (!this.lenBlock.error.length) this.blockLength += this.lenBlock.blockLength;

    if (!this.valueBlock.error.length) this.blockLength += this.valueBlock.blockLength;

    return resultOffset;
  }

  /**
   * Validates the raw value bytes before they are decoded
   * @param _view Value bytes read from BER
   * @returns Error message, or an empty string if the value is valid
   */
  protected checkValue(_view: Uint8Array): string {
    return EMPTY_STRING;
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
