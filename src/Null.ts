import type { ViewWriter } from "./ViewWriter";
import { ValueBlock, type ValueBlockJson } from "./ValueBlock";
import { BaseBlock, type BaseBlockJson, type BaseBlockParams } from "./BaseBlock";
import { typeStore } from "./TypeStore";
import { toUint8Array } from "@peculiar/utils";
import type { FromBerContext } from "./parser";
import { checkPrimitiveEncoding } from "./der";
import { report } from "./internals/der";
import { checkBufferParams } from "./internals/utils";

export type NullParams = BaseBlockParams;
export type NullJson = BaseBlockJson<ValueBlockJson>;

export class Null extends BaseBlock<ValueBlock, ValueBlockJson> {
  static {
    typeStore.Null = this;
  }

  public static override NAME = "NULL";

  constructor(parameters: NullParams = {}) {
    // We will not have a call to "Null value block" because of specified FROM_BER and TO_BER functions
    super(parameters, ValueBlock);

    this.idBlock.tagClass = 1; // UNIVERSAL
    this.idBlock.tagNumber = 5; // Null
  }

  public override fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number, context?: FromBerContext): number {
    if (context?.encodingRules === "DER") {
      const inputView = toUint8Array(inputBuffer);
      if (!checkBufferParams(this, inputView, inputOffset, inputLength)) return -1;
      const issue = checkPrimitiveEncoding(5, false, inputView.subarray(inputOffset, inputOffset + inputLength));
      if (issue) {
        this.error = report(context, issue);
        return -1;
      }
    }

    if (this.lenBlock.length > 0) this.warnings.push("Non-zero length of value block for Null type");

    if (!this.idBlock.error.length) this.blockLength += this.idBlock.blockLength;

    if (!this.lenBlock.error.length) this.blockLength += this.lenBlock.blockLength;

    this.blockLength += inputLength;

    if (inputOffset + inputLength > inputBuffer.byteLength) {
      this.error = "End of input reached before message was fully decoded (inconsistent offset and length values)";

      return -1;
    }

    return inputOffset + inputLength;
  }

  public override toBER(sizeOnly?: boolean, writer?: ViewWriter): ArrayBuffer {
    const retBuf = new ArrayBuffer(2);

    if (!sizeOnly) {
      const retView = new Uint8Array(retBuf);
      retView[0] = 0x05;
      retView[1] = 0x00;
    }

    if (writer) {
      writer.write(retBuf);
    }

    return retBuf;
  }

  protected override onAsciiEncoding(): string {
    return `${(this.constructor as typeof Null).NAME}`;
  }
}
