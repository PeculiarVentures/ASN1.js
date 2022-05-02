import { ValueBlock } from "../ValueBlock";
import { EMPTY_BUFFER } from "./constants";

export class LocalEndOfContentValueBlock extends ValueBlock {

  public static override = "EndOfContentValueBlock";

  public override fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
    // There is no "value block" for EndOfContent type and we need to return the same offset
    return inputOffset;
  }

  public override toBER(sizeOnly?: boolean): ArrayBuffer {
    return EMPTY_BUFFER;
  }
}
