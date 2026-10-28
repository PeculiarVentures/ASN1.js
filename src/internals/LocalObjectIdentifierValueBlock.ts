import { ValueBlock, type ValueBlockJson, type ValueBlockParams } from "../ValueBlock";
import type { IStringConvertible } from "../types";
import { EMPTY_BUFFER, EMPTY_VIEW } from "./constants";
import * as utils from "./utils";
import { type LocalSidValueBlockJson, LocalSidValueBlock } from "./LocalSidValueBlock";
import { getSidValue, MAX_SAFE_SID, parseOidComponents } from "./oidUtils";

export interface ILocalObjectIdentifierValueBlock {
  value: string;
}

export interface LocalObjectIdentifierValueBlockParams extends ValueBlockParams, Partial<ILocalObjectIdentifierValueBlock> {}

export interface LocalObjectIdentifierValueBlockJson extends ValueBlockJson, ILocalObjectIdentifierValueBlock {
  sidArray: LocalSidValueBlockJson[];
}

export class LocalObjectIdentifierValueBlock extends ValueBlock implements IStringConvertible {
  public static override NAME = "ObjectIdentifierValueBlock";

  public value: LocalSidValueBlock[] = [];

  constructor({ value, ...parameters }: LocalObjectIdentifierValueBlockParams = {}) {
    super(parameters);

    if (value !== undefined) {
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

      if (this.value.length === 0) sidBlock.isFirstSid = true;

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
    this.value = [];
    this.error = "";
    this.warnings = [];
    this.blockLength = 0;
    this.valueBeforeDecodeView = EMPTY_VIEW;

    const components = parseOidComponents(string);
    if (!components || components.length < 2) {
      this.error = "Object identifier must contain at least two non-negative decimal components";
      return;
    }

    const [root, second] = components;
    if (root > 2n || (root < 2n && second > 39n)) {
      this.error = "Invalid first two object identifier components";
      return;
    }

    const values = [root * 40n + second, ...components.slice(2)];
    this.value = values.map((value, index) => {
      const sid = new LocalSidValueBlock({ isFirstSid: index === 0 });
      if (value <= MAX_SAFE_SID) sid.valueDec = Number(value);
      else sid.valueBigInt = value;
      return sid;
    });
  }

  public override toString(): string {
    return this.value
      .map((sid, index) => {
        const value = getSidValue(sid);
        if (index !== 0) return value.toString();
        if (typeof value === "bigint") {
          if (value < 40n) return `0.${value}`;
          if (value < 80n) return `1.${value - 40n}`;
          return `2.${value - 80n}`;
        }

        if (value < 40) return `0.${value}`;
        if (value < 80) return `1.${value - 40}`;
        return `2.${value - 80}`;
      })
      .join(".");
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
