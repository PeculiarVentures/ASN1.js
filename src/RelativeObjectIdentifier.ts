import { BaseBlock, BaseBlockJson, BaseBlockParams } from "./BaseBlock";
import { LocalRelativeObjectIdentifierValueBlockParams, LocalRelativeObjectIdentifierValueBlock, LocalRelativeObjectIdentifierValueBlockJson } from "./internals/LocalRelativeObjectIdentifierValueBlock";
import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";


export interface RelativeObjectIdentifierParams extends BaseBlockParams, LocalRelativeObjectIdentifierValueBlockParams { }
export interface RelativeObjectIdentifierJson extends BaseBlockJson<LocalRelativeObjectIdentifierValueBlockJson> {
  value: string;
}

export class RelativeObjectIdentifier extends BaseBlock<LocalRelativeObjectIdentifierValueBlock, LocalRelativeObjectIdentifierValueBlockJson> {

  static {
    typeStore.RelativeObjectIdentifier = this;
  }

  /**
   * Gets string representation of Relative Object Identifier
   * @since 3.0.0
   */
  public getValue(): string {
    return this.valueBlock.toString();
  }

  /**
   * Sets Relative Object Identifier value from string
   * @param value String value
   * @since 3.0.0
   */
  public setValue(value: string): void {
    this.valueBlock.fromString(value);
  }

  public static override NAME = "RelativeObjectIdentifier";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.RelativeObjectIdentifier};

  constructor(parameters: RelativeObjectIdentifierParams = {}) {
    RelativeObjectIdentifier.mergeIDBlock(parameters, RelativeObjectIdentifier.defaultIDs);
    super(parameters, LocalRelativeObjectIdentifierValueBlock);
  }

  protected override onAsciiEncoding(): string {
    return `${(this.constructor as typeof RelativeObjectIdentifier).NAME} : ${this.valueBlock.toString() || "empty"}`;
  }

  public override toJSON(): RelativeObjectIdentifierJson {
    return {
      ...super.toJSON(),
      value: this.getValue(),
    };
  }

  /**
   * A typeguard that allows to validate if a certain asn1.js object is of our type
   */
  public static typeGuard(obj: unknown | undefined): obj is RelativeObjectIdentifier {
    return this.matches(obj);
  }

}
