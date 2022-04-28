import { EMPTY_STRING } from "./internals/constants";

export interface IAny {
  name: string;
  optional: boolean;
}

export type AnyParams = Partial<IAny>;

export class Any implements IAny {

  public name: string;
  public optional: boolean;

  constructor({
    name = EMPTY_STRING, optional = false,
  }: AnyParams = {}) {
    this.name = name;
    this.optional = optional;
  }

}
