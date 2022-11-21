import { IAny, Any } from "./Any";
import { ILocalIdentificationBlockParams, LocalIdentificationBlock } from "./internals/LocalIdentificationBlock";

export interface IRepeated extends IAny {
  value: Any;
  local: boolean;
}

export interface RepeatedParams extends ILocalIdentificationBlockParams, Partial<IRepeated> {
}


export class Repeated extends Any {

  public value: Any;
  public local: boolean;
  public idBlock: LocalIdentificationBlock;

  constructor({
    value = new Any(),
    local = false,
    ...parameters
  }: RepeatedParams = {}) {
    super(parameters);

    // If the property is not explicitly defined as optional it may also be defined as optional with defining of the optionalID
    if(parameters.idBlock?.optionalID !== undefined && parameters.idBlock.optionalID >= 0)
      this.optional = true;

    this.idBlock = new LocalIdentificationBlock(parameters);

    this.value = value;
    this.local = local; // Could local or global array to store elements
  }

}
