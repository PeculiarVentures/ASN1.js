import { ILocalStringValueBlock, LocalStringValueBlockParams, LocalStringValueBlockJson, LocalStringValueBlock } from "./LocalStringValueBlock";

export type ILocalUtf8StringValueBlock = ILocalStringValueBlock;
export type LocalUtf8StringValueBlockParams = LocalStringValueBlockParams;
export type LocalUtf8StringValueBlockJson = LocalStringValueBlockJson;

export class LocalUtf8StringValueBlock extends LocalStringValueBlock {

  public static override NAME = "Utf8StringValueBlock";

}
