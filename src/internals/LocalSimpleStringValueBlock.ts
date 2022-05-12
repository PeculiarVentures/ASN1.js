import { ILocalStringValueBlock, LocalStringValueBlockParams, LocalStringValueBlockJson, LocalStringValueBlock } from "./LocalStringValueBlock";

export type ILocalSimpleStringValueBlock = ILocalStringValueBlock;
export type LocalSimpleStringValueBlockParams = LocalStringValueBlockParams;
export type LocalSimpleStringValueBlockJson = LocalStringValueBlockJson;

export class LocalSimpleStringValueBlock extends LocalStringValueBlock {

  public static override NAME = "SimpleStringValueBlock";

}
