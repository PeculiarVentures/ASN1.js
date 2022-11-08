import { AsnType } from "../build";
import { BaseBlock, BaseBlockJson, BaseBlockParams } from "./BaseBlock";
import { LocalBaseBlock } from "./internals/LocalBaseBlock";
import { LocalConstructedValueBlock, LocalConstructedValueBlockJson, LocalConstructedValueBlockParams } from "./internals/LocalConstructedValueBlock";
import { IBaseIDs } from "./internals/LocalIdentificationBlock";
import { typeStore } from "./TypeStore";

export interface ConstructedParams extends BaseBlockParams, LocalConstructedValueBlockParams { }
export type ConstructedJson = BaseBlockJson<LocalConstructedValueBlockJson>;

export class Constructed extends BaseBlock<LocalConstructedValueBlock, LocalConstructedValueBlockJson> {

  static {
    typeStore.Constructed = this;
  }

  public static override NAME = "CONSTRUCTED";

  constructor(parameters: ConstructedParams = {}) {
    super(parameters, LocalConstructedValueBlock);

    this.idBlock.isConstructed = true;
  }

  public override fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
    this.valueBlock.isIndefiniteForm = this.lenBlock.isIndefiniteForm;

    const resultOffset = this.valueBlock.fromBER(inputBuffer, inputOffset, (this.lenBlock.isIndefiniteForm) ? inputLength : this.lenBlock.length);
    if (resultOffset === -1) {
      this.error = this.valueBlock.error;

      return resultOffset;
    }

    if (!this.idBlock.error.length)
      this.blockLength += this.idBlock.blockLength;

    if (!this.lenBlock.error.length)
      this.blockLength += this.lenBlock.blockLength;

    if (!this.valueBlock.error.length)
      this.blockLength += this.valueBlock.blockLength;

    return resultOffset;
  }

  /**
   * @internal
   */
  public override onAsciiEncoding(): string {
    const values = [];
    for (const value of this.valueBlock.value) {
      values.push(value.toString("ascii").split("\n").map(o => `  ${o}`).join("\n"));
    }
    const blockName = this.idBlock.tagClass === 3
      ? `[${this.idBlock.tagNumber}]`
      : (this.constructor as typeof Constructed).NAME;

    return values.length
      ? `${blockName} :\n${values.join("\n")}` // items
      : `${blockName} :`; // empty
  }

  /**
   * Queries a value from the valueBlock by name
   *
   * @param name - the property we are looking for
   * @returns the property if found or undefined
   */
  public getValueByName(name: string): AsnType | undefined {
    const fields = this.valueBlock.value;
    for (const value of fields) {
      if (value.name === name)
          return value as unknown as AsnType;
    }
    return undefined;
  }

  /**
   * Queries a value from the valueBlock by name and ensures it is of the given type
   *
   * @param type - the property type we are looking for
   * @param name - the property we are looking for
   * @returns the property if found or undefined
   */
  public getTypedValueByName<T extends LocalBaseBlock>(c: new () => T, name: string): T | undefined {
    const ids = (c as unknown as {defaultIDs: IBaseIDs}).defaultIDs;
    if (ids) {
      const fields = this.valueBlock.value;
      for (const value of fields) {
        if (value.name === name) {
          if(value.idBlock.isIdenticalType(ids))
            return value as unknown as T;
        }
      }
    }
    return undefined;
  }

 public getValue(): BaseBlock[] {
    return this.valueBlock.value;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public setValue(value: BaseBlock[]): void {
    this.valueBlock.value = value;
  }
}
