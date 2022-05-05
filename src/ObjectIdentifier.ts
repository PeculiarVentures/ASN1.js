import { BaseBlock, BaseBlockJson, BaseBlockParams } from "./BaseBlock";
import { LocalObjectIdentifierValueBlockParams, LocalObjectIdentifierValueBlock, LocalObjectIdentifierValueBlockJson } from "./internals/LocalObjectIdentifierValueBlock";
import { typeStore } from "./TypeStore";

export interface ObjectIdentifierParams extends BaseBlockParams, LocalObjectIdentifierValueBlockParams { }
export type ObjectIdentifierJson = BaseBlockJson<LocalObjectIdentifierValueBlockJson>;

export class ObjectIdentifier extends BaseBlock<LocalObjectIdentifierValueBlock, LocalObjectIdentifierValueBlockJson> {

  static {
    typeStore.ObjectIdentifier = this;
  }

  public static override NAME = "OBJECT IDENTIFIER";

  constructor(parameters: ObjectIdentifierParams = {}) {
    super(parameters, LocalObjectIdentifierValueBlock);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 6; // OBJECT IDENTIFIER
  }

  public override toString(): string {
    return `${(this.constructor as typeof ObjectIdentifier).NAME} : ${this.valueBlock.toString()}`;
  }

}
