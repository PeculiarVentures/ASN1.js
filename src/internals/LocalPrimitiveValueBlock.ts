import { HexBlock } from "../HexBlock";
import { ValueBlock } from "../ValueBlock";

export class LocalPrimitiveValueBlock extends HexBlock(ValueBlock) {

  public static override NAME = "PrimitiveValueBlock";

}
