import { ILocalStringValueBlock, LocalStringValueBlockParams, LocalStringValueBlockJson, LocalStringValueBlock } from "./LocalStringValueBlock";

export type ILocalBmpStringValueBlock = ILocalStringValueBlock;
export type LocalBmpStringValueBlockParams = LocalStringValueBlockParams;
export type LocalBmpStringValueBlockJson = LocalStringValueBlockJson;

export class LocalBmpStringValueBlock extends LocalStringValueBlock {

  public static override NAME = "BmpStringValueBlock";
}
