import * as pvtsutils from "pvtsutils";
import { LocalBaseBlockJson } from "./LocalBaseBlock";
import { EMPTY_BUFFER, END_OF_CONTENT_NAME } from "./constants";
import type { BaseBlock } from "../BaseBlock";
import { ValueBlock, ValueBlockParams } from "../ValueBlock";
import { ViewWriter } from "../ViewWriter";
import { localFromBER } from "../parser";
import { checkBufferParams } from "./utils";
import type { Any } from "../Any";

export type ConstructedItem = BaseBlock | Any;

export interface ILocalConstructedValueBlock {
  value: ConstructedItem[];
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

    this.value = value as BaseBlock[]; // It's possible to set Any type for Schema declaration
    this.isIndefiniteForm = isIndefiniteForm;
  }

  public override fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
    const view = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);

    // Basic check for parameters
    if (!checkBufferParams(this, view, inputOffset, inputLength)) {
      return -1;
    }

    this.valueBeforeDecodeView = view.subarray(inputOffset, inputOffset + inputLength);

    // Initial checks
    if (this.valueBeforeDecodeView.length === 0) {
      this.warnings.push("Zero buffer length");

      return inputOffset;
    }

    let currentOffset = inputOffset;

    while (checkLen(this.isIndefiniteForm, inputLength) > 0) {
      const returnObject = localFromBER(view, currentOffset, inputLength);
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
