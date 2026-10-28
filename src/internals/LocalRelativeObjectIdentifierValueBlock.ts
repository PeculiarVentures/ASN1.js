import type { ViewWriter } from "../ViewWriter";
import { ValueBlock, type ValueBlockJson, type ValueBlockParams } from "../ValueBlock";
import type { IStringConvertible } from "../types";
import { EMPTY_BUFFER, EMPTY_VIEW } from "./constants";
import * as utils from "./utils";
import { type LocalRelativeSidValueBlockJson, LocalRelativeSidValueBlock } from "./LocalRelativeSidValueBlock";
import { getSidValue, MAX_SAFE_SID, parseOidComponents, setOidError, setSidValue, validateOidSids } from "./oidUtils";

export interface ILocalRelativeObjectIdentifierValueBlock {
  value: string;
}

export interface LocalRelativeObjectIdentifierValueBlockParams extends ValueBlockParams, Partial<ILocalRelativeObjectIdentifierValueBlock> {
  /** Throw on invalid value assignment or encoding. Defaults to `false`. */
  strict?: boolean;
}

export interface LocalRelativeObjectIdentifierValueBlockJson extends ValueBlockJson, ILocalRelativeObjectIdentifierValueBlock {
  sidArray: LocalRelativeSidValueBlockJson[];
}

export class LocalRelativeObjectIdentifierValueBlock extends ValueBlock implements IStringConvertible {
  public static override NAME = "RelativeObjectIdentifierValueBlock";

  public value: LocalRelativeSidValueBlock[] = [];
  public strict: boolean;

  constructor({ value, strict = false, ...parameters }: LocalRelativeObjectIdentifierValueBlockParams = {}) {
    super(parameters);
    this.strict = strict;

    if (value !== undefined) {
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

  public override toBER(sizeOnly?: boolean, _writer?: ViewWriter): ArrayBuffer {
    if (this.strict) {
      const error = this.error || validateOidSids(this.value);
      if (error) setOidError(this, error);
    }
    const retBuffers: ArrayBuffer[] = [];

    for (let i = 0; i < this.value.length; i++) {
      const valueBuf = this.value[i].toBER(sizeOnly);
      if (valueBuf.byteLength === 0) {
        this.error = this.value[i].error;
        if (this.strict) setOidError(this, this.error || "Error during encoding SID value");

        return EMPTY_BUFFER;
      }

      retBuffers.push(valueBuf);
    }

    return utils.concat(retBuffers);
  }

  public fromString(string: string): boolean {
    this.value = [];
    this.error = "";
    this.warnings = [];
    this.blockLength = 0;
    this.valueBeforeDecodeView = EMPTY_VIEW;

    const components = parseOidComponents(string);
    if (!components) {
      setOidError(this, "Relative object identifier must contain non-negative decimal components");
      return false;
    }

    this.value = components.map((value) => {
      const sid = new LocalRelativeSidValueBlock();
      if (value <= MAX_SAFE_SID) sid.valueDec = Number(value);
      else setSidValue(sid, value);
      return sid;
    });
    return true;
  }

  public override toString(): string {
    return this.value.map((sid) => getSidValue(sid).toString()).join(".");
  }

  public override toJSON(): LocalRelativeObjectIdentifierValueBlockJson {
    const object: LocalRelativeObjectIdentifierValueBlockJson = {
      ...super.toJSON(),
      value: this.toString(),
      sidArray: [],
    };

    for (let i = 0; i < this.value.length; i++) object.sidArray.push(this.value[i].toJSON());

    return object;
  }
}
