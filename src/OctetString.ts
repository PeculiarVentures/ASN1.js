import * as pvutils from "pvutils";
import { BaseBlock, BaseBlockParams } from "./BaseBlock";
import { Constructed } from "./Constructed";
import { LocalOctetStringValueBlockParams, LocalOctetStringValueBlock } from "./internals/LocalOctetStringValueBlock";
import { OCTET_STRING_NAME } from "./internals/constants";
import { fromBER } from "./parser";
import { typeStore } from "./TypeStore";

export interface OctetStringParams extends BaseBlockParams, LocalOctetStringValueBlockParams { }

export class OctetString extends BaseBlock<LocalOctetStringValueBlock> {

  static {
    typeStore.OctetString = this;
  }

  public static override NAME = OCTET_STRING_NAME;

  constructor(parameters: OctetStringParams = {}) {
    super(parameters, LocalOctetStringValueBlock);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 4; // OctetString
  }

  public override fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number {
    this.valueBlock.isConstructed = this.idBlock.isConstructed;
    this.valueBlock.isIndefiniteForm = this.lenBlock.isIndefiniteForm;

    //#region Ability to encode empty OCTET STRING
    if (inputLength === 0) {
      if (this.idBlock.error.length === 0)
        this.blockLength += this.idBlock.blockLength;

      if (this.lenBlock.error.length === 0)
        this.blockLength += this.lenBlock.blockLength;

      return inputOffset;
    }
    //#endregion
    if (!this.valueBlock.isConstructed) {
      const buf = inputBuffer.slice(inputOffset, inputOffset + inputLength);
      try {
        const asn = fromBER(buf);
        if (asn.offset !== -1 && asn.offset === inputLength) {
          this.valueBlock.value = [asn.result];
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
      return `${(this.constructor as typeof OctetString).NAME} : ${pvutils.bufferToHexCodes(this.valueBlock.valueHex)}`;
    }
  }

}
