import { IBerConvertible } from "./types";
import * as internals from "./internals/LocalBaseBlock";
import { ViewWriter } from "./ViewWriter";

export type IValueBlock = internals.ILocalBaseBlock;
export type ValueBlockParams = internals.LocalBaseBlockParams;
export type ValueBlockJson = internals.LocalBaseBlockJson;

export class ValueBlock extends internals.LocalBaseBlock implements IValueBlock, IBerConvertible {
  public static override NAME = "valueBlock";

  public fromBER(_inputBuffer: ArrayBuffer | Uint8Array, _inputOffset: number, _inputLength: number): number {
    throw TypeError("User need to make a specific function in a class which extends 'ValueBlock'");
  }

  public toBER(_sizeOnly?: boolean, _writer?: ViewWriter): ArrayBuffer {
    throw TypeError("User need to make a specific function in a class which extends 'ValueBlock'");
  }
}
