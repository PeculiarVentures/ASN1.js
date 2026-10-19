import type { BaseBlock } from "./BaseBlock";
import { type IAny, Any } from "./Any";

export interface IChoice extends IAny {
  value: BaseBlock[];
}

export type ChoiceParams = Partial<IChoice>;

export class Choice extends Any implements IChoice {
  public value: BaseBlock[];

  constructor({ value = [], ...parameters }: ChoiceParams = {}) {
    super(parameters);

    this.value = value;
  }
}
