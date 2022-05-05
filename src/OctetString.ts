import * as pvtsutils from "pvtsutils";
import { BaseBlock, BaseBlockJson, BaseBlockParams } from "./BaseBlock";
import { Constructed } from "./Constructed";
import { LocalOctetStringValueBlockParams, LocalOctetStringValueBlock, LocalOctetStringValueBlockJson } from "./internals/LocalOctetStringValueBlock";
import { OCTET_STRING_NAME } from "./internals/constants";
import { localFromBER } from "./parser";
import { typeStore } from "./TypeStore";

export interface OctetStringParams extends BaseBlockParams, LocalOctetStringValueBlockParams { }
export type OctetStringJson = BaseBlockJson<LocalOctetStringValueBlockJson>;

export class OctetString extends BaseBlock<LocalOctetStringValueBlock, LocalOctetStringValueBlockJson> {

  static {
    typeStore.OctetString = this;
  }

  public static override NAME = OCTET_STRING_NAME;

  constructor(parameters: OctetStringParams = {}) {
    super(parameters, LocalOctetStringValueBlock);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 4; // OctetString
  }

  public override fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
    this.valueBlock.isConstructed = this.idBlock.isConstructed;
    this.valueBlock.isIndefiniteForm = this.lenBlock.isIndefiniteForm;

    // Ability to encode empty OCTET STRING
    if (inputLength === 0) {
      if (this.idBlock.error.length === 0)
        this.blockLength += this.idBlock.blockLength;

      if (this.lenBlock.error.length === 0)
        this.blockLength += this.lenBlock.blockLength;

      return inputOffset;
    }

    if (!this.valueBlock.isConstructed) {
      const view = inputBuffer instanceof ArrayBuffer ? new Uint8Array(inputBuffer) : inputBuffer;
      const buf = view.subarray(inputOffset, inputOffset + inputLength);
      try {
        if (buf.byteLength) {
          const asn = localFromBER(buf, 0, buf.byteLength);
          if (asn.offset !== -1 && asn.offset === inputLength) {
            this.valueBlock.value = [asn.result as OctetString];
          }
        }
      } catch (e) {
        // nothing
      }
    }

    return super.fromBER(inputBuffer, inputOffset, inputLength);
  }

  public override toString(): string {
    if (this.valueBlock.isConstructed || (this.valueBlock.value && this.valueBlock.value.length)) {
      return Constructed.prototype.toString.call(this);
    } else {
      return `${(this.constructor as typeof OctetString).NAME} : ${pvtsutils.Convert.ToHex(this.valueBlock.valueHexView)}`;
    }
  }

}
