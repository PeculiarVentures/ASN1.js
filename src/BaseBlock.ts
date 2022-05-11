import * as pvtsutils from "pvtsutils";
import * as pvutils from "pvutils";
import { IBerConvertible } from "./types";
import { LocalBaseBlockJson, LocalBaseBlockParams, LocalBaseBlock } from "./internals/LocalBaseBlock";
import { LocalIdentificationBlock, LocalIdentificationBlockJson, LocalIdentificationBlockParams } from "./internals/LocalIdentificationBlock";
import { LocalLengthBlock, LocalLengthBlockJson, LocalLengthBlockParams } from "./internals/LocalLengthBlock";
import { ViewWriter } from "./ViewWriter";
import { ValueBlock, ValueBlockJson } from "./ValueBlock";
import { EMPTY_BUFFER, EMPTY_STRING } from "./internals/constants";
import { typeStore } from "./TypeStore";

export interface IBaseBlock {
  name: string;
  optional: boolean;
  primitiveSchema?: BaseBlock;
}

export interface BaseBlockParams extends LocalBaseBlockParams, LocalIdentificationBlockParams, LocalLengthBlockParams, Partial<IBaseBlock> { }

export interface ValueBlockConstructor<T extends ValueBlock = ValueBlock> {
  new(...args: any[]): T;
}

export interface BaseBlockJson<T extends LocalBaseBlockJson = LocalBaseBlockJson> extends LocalBaseBlockJson, Omit<IBaseBlock, "primitiveSchema"> {
  idBlock: LocalIdentificationBlockJson;
  lenBlock: LocalLengthBlockJson;
  valueBlock: T;
  primitiveSchema?: BaseBlockJson;
}

export type StringEncoding = "ascii" | "hex";

export class BaseBlock<T extends ValueBlock = ValueBlock, J extends ValueBlockJson = ValueBlockJson> extends LocalBaseBlock implements IBaseBlock, IBerConvertible {

  static {

  }

  public static override NAME = "BaseBlock";

  public idBlock: LocalIdentificationBlock;
  public lenBlock: LocalLengthBlock;
  public valueBlock: T;
  public name: string;
  public optional: boolean;
  public primitiveSchema?: BaseBlock;

  constructor({
    name = EMPTY_STRING,
    optional = false,
    primitiveSchema,
    ...parameters
  }: BaseBlockParams = {}, valueBlockType?: ValueBlockConstructor<T>) {
    super(parameters);

    this.name = name;
    this.optional = optional;
    if (primitiveSchema) {
      this.primitiveSchema = primitiveSchema;
    }

    this.idBlock = new LocalIdentificationBlock(parameters);
    this.lenBlock = new LocalLengthBlock(parameters);
    this.valueBlock = valueBlockType ? new valueBlockType(parameters) : new ValueBlock(parameters) as unknown as T;
  }

  public fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
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

  public toBER(sizeOnly?: boolean, writer?: ViewWriter): ArrayBuffer {
    const _writer = writer || new ViewWriter();

    if (!writer) {
      prepareIndefiniteForm(this);
    }

    const idBlockBuf = this.idBlock.toBER(sizeOnly);

    _writer.write(idBlockBuf);

    if (this.lenBlock.isIndefiniteForm) {
      _writer.write(new Uint8Array([0x80]).buffer);

      this.valueBlock.toBER(sizeOnly, _writer);

      _writer.write(new ArrayBuffer(2));
    }
    else {
      const valueBlockBuf = this.valueBlock.toBER(sizeOnly);
      this.lenBlock.length = valueBlockBuf.byteLength;
      const lenBlockBuf = this.lenBlock.toBER(sizeOnly);

      _writer.write(lenBlockBuf);
      _writer.write(valueBlockBuf);
    }

    if (!writer) {
      return _writer.final();
    }

    return EMPTY_BUFFER;
  }

  public override toJSON(): BaseBlockJson<J> {
    const object: BaseBlockJson = {
      ...super.toJSON(),
      idBlock: this.idBlock.toJSON(),
      lenBlock: this.lenBlock.toJSON(),
      valueBlock: this.valueBlock.toJSON(),
      name: this.name,
      optional: this.optional,
    };


    if (this.primitiveSchema)
      object.primitiveSchema = this.primitiveSchema.toJSON();

    return object as BaseBlockJson<J>;
  }
  public override toString(encoding: StringEncoding = "ascii"): string {
    if (encoding === "ascii") {
      return this.onAsciiEncoding();
    }

    return pvtsutils.Convert.ToHex(this.toBER());
  }

  protected onAsciiEncoding(): string {
    return `${(this.constructor as typeof BaseBlock).NAME} : ${pvtsutils.Convert.ToHex(this.valueBlock.valueBeforeDecodeView)}`;
  }

  /**
   * Determines whether two object instances are equal
   * @param other Object to compare with the current object
   */
  public isEqual(other: unknown): other is this {
    if (this === other) {
      return true;
    }

    // Check input type
    if (!(other instanceof this.constructor)) {
      return false;
    }

    const thisRaw = this.toBER();
    const otherRaw = (other as BaseBlock).toBER();

    return pvutils.isEqualBuffer(thisRaw, otherRaw);
  }

}

/**
 * Recursive function which checks and enables isIndefiniteForm flag for constructed blocks if any child has that flag enabled
 * @param baseBlock Base ASN.1 block
 * @returns Returns `true` if incoming block is `indefinite form`
 */
function prepareIndefiniteForm(baseBlock: BaseBlock): boolean {
  if (baseBlock instanceof typeStore.Constructed) {
    for (const value of baseBlock.valueBlock.value) {
      if (prepareIndefiniteForm(value)) {
        baseBlock.lenBlock.isIndefiniteForm = true;
      }
    }
  }

  return !!baseBlock.lenBlock.isIndefiniteForm;
}
