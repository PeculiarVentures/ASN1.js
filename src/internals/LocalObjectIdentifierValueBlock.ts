import { ValueBlock, ValueBlockJson, ValueBlockParams } from "../ValueBlock";
import { EMPTY_BUFFER, EMPTY_STRING } from "./constants";
import * as utils from "./utils";
import { LocalSidValueBlockJson, LocalSidValueBlock } from "./LocalSidValueBlock";
import { IStringConvertible } from "../types";


export interface ILocalObjectIdentifierValueBlock {
  value: string;
}

export interface LocalObjectIdentifierValueBlockParams extends ValueBlockParams, Partial<ILocalObjectIdentifierValueBlock> { }

export interface LocalObjectIdentifierValueBlockJson extends ValueBlockJson, ILocalObjectIdentifierValueBlock {
  sidArray: LocalSidValueBlockJson[];
}

export class LocalObjectIdentifierValueBlock extends ValueBlock implements IStringConvertible {

  public static override NAME = "ObjectIdentifierValueBlock";

  public value: LocalSidValueBlock[] = [];

  constructor({
    value = EMPTY_STRING,
    ...parameters
  }: LocalObjectIdentifierValueBlockParams = {}) {
    super(parameters);

    if (value) {
      this.fromString(value);
    }
  }

  public override fromBER(inputBuffer: ArrayBuffer | Uint8Array, inputOffset: number, inputLength: number): number {
    let resultOffset = inputOffset;

    while (inputLength > 0) {
      const sidBlock = new LocalSidValueBlock();
      resultOffset = sidBlock.fromBER(inputBuffer, resultOffset, inputLength);
      if (resultOffset === -1) {
        this.blockLength = 0;
        this.error = sidBlock.error;

        return resultOffset;
      }

      if (this.value.length === 0)
        sidBlock.isFirstSid = true;

      this.blockLength += sidBlock.blockLength;
      inputLength -= sidBlock.blockLength;

      this.value.push(sidBlock);
    }

    return resultOffset;
  }
  public override toBER(sizeOnly?: boolean): ArrayBuffer {
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

  public fromString(string: string): void {
    this.value = []; // Clear existing SID values

    let pos1 = 0;
    let pos2 = 0;

    let sid = "";

    let flag = false;

    // const sids = string.split(".");
    // for (const sid of sids) {

    // }
    do {
      pos2 = string.indexOf(".", pos1);
      if (pos2 === -1)
        sid = string.substring(pos1);

      else
        sid = string.substring(pos1, pos2);

      pos1 = pos2 + 1;

      if (flag) {
        const sidBlock = this.value[0];

        let plus = 0;

        switch (sidBlock.valueDec) {
          case 0:
            break;
          case 1:
            plus = 40;
            break;
          case 2:
            plus = 80;
            break;
          default:
            this.value = []; // clear SID array

            return;
        }

        const parsedSID = parseInt(sid, 10);
        if (isNaN(parsedSID))
          return;

        sidBlock.valueDec = parsedSID + plus;

        flag = false;
      } else {
        const sidBlock = new LocalSidValueBlock();
        if ((sid as any) > Number.MAX_SAFE_INTEGER) { // TODO remove as any
          utils.assertBigInt();
          const sidValue = BigInt(sid);
          sidBlock.valueBigInt = sidValue;
        } else {
          sidBlock.valueDec = parseInt(sid, 10);
          if (isNaN(sidBlock.valueDec))
            return;
        }

        if (!this.value.length) {
          sidBlock.isFirstSid = true;
          flag = true;
        }

        this.value.push(sidBlock);
      }
    } while (pos2 !== -1);
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

        if (this.value[i].isFirstSid)
          result = `2.{${sidStr} - 80}`;

        else
          result += sidStr;
      }

      else
        result += sidStr;
    }

    return result;
  }

  public override toJSON(): LocalObjectIdentifierValueBlockJson {
    const object: LocalObjectIdentifierValueBlockJson = {
      ...super.toJSON(),
      value: this.toString(),
      sidArray: [],
    };

    for (let i = 0; i < this.value.length; i++) {
      object.sidArray.push(this.value[i].toJSON());
    }

    return object;
  }

}
