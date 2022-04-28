import * as pvutils from "pvutils";
import { EMPTY_STRING, EMPTY_BUFFER } from "./constants";

export interface ILocalBaseBlock {
  blockLength: number;
  error: string;
  warnings: string[];
  valueBeforeDecode: ArrayBuffer;
}

export interface LocalBaseBlockJson extends Omit<ILocalBaseBlock, "valueBeforeDecode"> {
  blockName: string;
  valueBeforeDecode: string;
}

export type LocalBaseBlockParams = Partial<ILocalBaseBlock>;

export interface LocalBaseBlockConstructor<T extends LocalBaseBlock = LocalBaseBlock> {
  new(...args: any[]): T;
  prototype: T;
  NAME: string;
  blockName(): string;
}

/**
 * Class used as a base block for all remaining ASN.1 classes
 */
export class LocalBaseBlock implements ILocalBaseBlock {

  /**
   * Name of the block
   */
  public static NAME = "baseBlock";
  /**
   * Aux function, need to get a block name. Need to have it here for inheritance
   * @returns Returns name of the block
   */
  public static blockName(): string {
    return this.NAME;
  }

  public blockLength: number;
  public error: string;
  public warnings: string[];
  public valueBeforeDecode: ArrayBuffer;

  /**
   * Creates and initializes an object instance of that class
   * @param param0 Initialization parameters
   */
  constructor({
    blockLength = 0,
    error = EMPTY_STRING,
    warnings = [],
    valueBeforeDecode = EMPTY_BUFFER,
  }: LocalBaseBlockParams = {}) {
    this.blockLength = blockLength;
    this.error = error;
    this.warnings = warnings;
    this.valueBeforeDecode = valueBeforeDecode;
  }

  /**
   * Returns a JSON representation of an object
   * @returns JSON object
   */
  public toJSON(): LocalBaseBlockJson {
    return {
      blockName: (this.constructor as typeof LocalBaseBlock).NAME,
      blockLength: this.blockLength,
      error: this.error,
      warnings: this.warnings,
      valueBeforeDecode: pvutils.bufferToHexCodes(this.valueBeforeDecode, 0, this.valueBeforeDecode.byteLength)
    };
  }

}
