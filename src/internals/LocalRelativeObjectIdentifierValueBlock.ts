import { ViewWriter } from "../ViewWriter";
import { ValueBlock, ValueBlockJson, ValueBlockParams } from "../ValueBlock";
import { EMPTY_BUFFER, EMPTY_STRING } from "./constants";
import * as utils from "./utils";
import { LocalRelativeSidValueBlockJson, LocalRelativeSidValueBlock } from "./LocalRelativeSidValueBlock";
import { IStringConvertible } from "../types";

export interface ILocalRelativeObjectIdentifierValueBlock {
  value: string;
}

export interface LocalRelativeObjectIdentifierValueBlockParams extends ValueBlockParams, Partial<ILocalRelativeObjectIdentifierValueBlock> { }

export interface LocalRelativeObjectIdentifierValueBlockJson extends ValueBlockJson, ILocalRelativeObjectIdentifierValueBlock {
  sidArray: LocalRelativeSidValueBlockJson[];
}

export class LocalRelativeObjectIdentifierValueBlock extends ValueBlock implements IStringConvertible {

  public static override NAME = "RelativeObjectIdentifierValueBlock";

  public value: LocalRelativeSidValueBlock[] = [];

  constructor({
    value = EMPTY_STRING,
    ...parameters
  }: LocalRelativeObjectIdentifierValueBlockParams = {}) {
    super(parameters);

    if (value) {
      this.fromString(value);
    }
  }

  public override fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
    let resultOffset = inputOffset;

    while (inputLength > 0) {
      const sidBlock = new LocalRelativeSidValueBlock();
      resultOffset = sidBlock.fromBER(inputBuffer, resultOffset, inputLength);
      if (resultOffset === -1) {
        this.blockLength = 0;
        this.error = sidBlock.error;

        return resultOffset;
      }

      this.blockLength += sidBlock.blockLength;
      inputLength -= sidBlock.blockLength;

      this.value.push(sidBlock);
    }

    return resultOffset;
  }

  public override toBER(sizeOnly?: boolean, writer?: ViewWriter): ArrayBuffer {
    const retBuffers: ArrayBuffer[] = [];

    for (let i = 0; i < this.value.length; i++) {
      const valueBuf = this.value[i].toBER(sizeOnly);
      if (valueBuf.byteLength === 0) {
        this.error = this.value[i].error;

        return EMPTY_BUFFER;
      }

      retBuffers.push(valueBuf);
    }

    return utils.concat(retBuffers);
  }

  public fromString(string: string): boolean {
    this.value = []; // Clear existing SID values

    let pos1 = 0;
    let pos2 = 0;

    let sid = "";

    do {
      pos2 = string.indexOf(".", pos1);
      if (pos2 === -1)
        sid = string.substring(pos1);

      else
        sid = string.substring(pos1, pos2);

      pos1 = pos2 + 1;

      const sidBlock = new LocalRelativeSidValueBlock();
      sidBlock.valueDec = parseInt(sid, 10);
      if (isNaN(sidBlock.valueDec))
        return true;

      this.value.push(sidBlock);

    } while (pos2 !== -1);

    return true;
  }

  public override toString(): string {
    let result = "";
    let isHexOnly = false;

    for (let i = 0; i < this.value.length; i++) {
      isHexOnly = this.value[i].isHexOnly;

      let sidStr = this.value[i].toString();

      if (i !== 0)
        result = `${result}.`;

      if (isHexOnly) {
        sidStr = `{${sidStr}}`;
        result += sidStr;
      }
      else
        result += sidStr;
    }

    return result;
  }

  public override toJSON(): LocalRelativeObjectIdentifierValueBlockJson {
    const object: LocalRelativeObjectIdentifierValueBlockJson = {
      ...super.toJSON(),
      value: this.toString(),
      sidArray: [],
    };

    for (let i = 0; i < this.value.length; i++)
      object.sidArray.push(this.value[i].toJSON());

    return object;
  }

}
