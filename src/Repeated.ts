import { IAny, Any } from "./Any";

export interface IRepeated extends IAny {
  value: Any;
  local: boolean;
}

export type RepeatedParams = Partial<IRepeated>;

export class Repeated extends Any {

  public value: Any;
  public local: boolean;

  constructor({
    value = new Any(),
    local = false,
    ...parameters
  }: RepeatedParams = {}) {
    super(parameters);

    this.value = value;
    this.local = local; // Could local or global array to store elements
  }

}
