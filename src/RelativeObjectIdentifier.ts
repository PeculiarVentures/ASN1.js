import { BaseBlock, BaseBlockParams } from "./BaseBlock";
import { LocalRelativeObjectIdentifierValueBlockParams, LocalRelativeObjectIdentifierValueBlock, LocalRelativeObjectIdentifierValueBlockJson } from "./internals/LocalRelativeObjectIdentifierValueBlock";
import { typeStore } from "./TypeStore";


export interface RelativeObjectIdentifierParams extends BaseBlockParams, LocalRelativeObjectIdentifierValueBlockParams { }

export class RelativeObjectIdentifier extends BaseBlock<LocalRelativeObjectIdentifierValueBlock, LocalRelativeObjectIdentifierValueBlockJson> {

  static {
    typeStore.RelativeObjectIdentifier = this;
  }

  public static override NAME = "RelativeObjectIdentifier";

  constructor(parameters: RelativeObjectIdentifierParams = {}) {
    super(parameters, LocalRelativeObjectIdentifierValueBlock);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 13; // RELATIVE OBJECT IDENTIFIER
  }

}
