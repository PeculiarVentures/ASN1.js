import * as pvutils from "pvutils";
import { LocalBaseBlockJson } from "./LocalBaseBlock";
import { EMPTY_BUFFER, END_OF_CONTENT_NAME } from "./constants";
import type { BaseBlock } from "../BaseBlock";
import { ValueBlock, ValueBlockParams } from "../ValueBlock";
import { ViewWriter } from "../ViewWriter";
import { localFromBER } from "../parser";

export interface ILocalConstructedValueBlock {
  value: BaseBlock[];
  isIndefiniteForm: boolean;
}

export interface LocalConstructedValueBlockParams extends ValueBlockParams, Partial<ILocalConstructedValueBlock> { }

export interface LocalConstructedValueBlockJson extends LocalBaseBlockJson, Omit<ILocalConstructedValueBlock, "value"> {
  value: LocalBaseBlockJson[];
}

function checkLen(indefiniteLength: boolean, length: number): number {
  if (indefiniteLength) {
    return 1;
  }

  return length;
}

export class LocalConstructedValueBlock extends ValueBlock implements ILocalConstructedValueBlock {

  public static override NAME = "ConstructedValueBlock";

  public value: BaseBlock[];
  public isIndefiniteForm: boolean;

  constructor({
    value = [],
    isIndefiniteForm = false,
    ...parameters
  }: LocalConstructedValueBlockParams = {}) {
    super(parameters);

    this.value = value;
    this.isIndefiniteForm = isIndefiniteForm;
  }

  public override fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number {
    // Basic check for parameters
    if (!pvutils.checkBufferParams(this, inputBuffer, inputOffset, inputLength)) {
      return -1;
    }

    // Store initial offset and length
    const initialOffset = inputOffset;
    const initialLength = inputLength;

    // Getting Uint8Array from ArrayBuffer
    const intBuffer = new Uint8Array(inputBuffer, inputOffset, inputLength);

    // Initial checks
    if (intBuffer.length === 0) {
      this.warnings.push("Zero buffer length");

      return inputOffset;
    }

    let currentOffset = inputOffset;

    while (checkLen(this.isIndefiniteForm, inputLength) > 0) {
      const returnObject = localFromBER(inputBuffer, currentOffset, inputLength);
      if (returnObject.offset === -1) {
        this.error = returnObject.result.error;
        this.warnings.concat(returnObject.result.warnings);

        return -1;
      }

      currentOffset = returnObject.offset;

      this.blockLength += returnObject.result.blockLength;
      inputLength -= returnObject.result.blockLength;

      this.value.push(returnObject.result);

      if (this.isIndefiniteForm && (returnObject.result.constructor as typeof BaseBlock).NAME === END_OF_CONTENT_NAME) {
        break;
      }
    }

    if (this.isIndefiniteForm) {
      if ((this.value[this.value.length - 1].constructor as typeof BaseBlock).NAME === END_OF_CONTENT_NAME) {
        this.value.pop();
      } else {
        this.warnings.push("No EndOfContent block encoded");
      }
    }

    // Copy "inputBuffer" to VALUE_BEFORE_DECODE
    this.valueBeforeDecode = inputBuffer.slice(initialOffset, initialOffset + initialLength);

    return currentOffset;
  }

  public override toBER(sizeOnly?: boolean, writer?: ViewWriter): ArrayBuffer {
    const _writer = writer || new ViewWriter();

    for (let i = 0; i < this.value.length; i++) {
      this.value[i].toBER(sizeOnly, _writer);
    }

    if (!writer) {
      return _writer.final();
    }

    return EMPTY_BUFFER;
  }

  public override toJSON(): LocalConstructedValueBlockJson {
    const object: LocalConstructedValueBlockJson = {
      ...super.toJSON(),
      isIndefiniteForm: this.isIndefiniteForm,
      value: [],
    };

    for (const value of this.value) {
      object.value.push(value.toJSON());
    }

    return object;
  }
}
