import { BaseBlock } from "./BaseBlock";
import { IAny, Any } from "./Any";

export interface IChoice extends IAny {
  value: BaseBlock[];
}

export type ChoiceParams = Partial<IChoice>;

/**
 * A Choice is only used while schema validation
 * In that case the choice takes the place of a list of possible options while verifying a schema
 */
export class Choice extends Any implements IChoice {
  public value: BaseBlock[];

  constructor({
    value = [],
    ...parameters
  }: ChoiceParams = {}) {
    super(parameters);

    this.value = value;
  }

}
