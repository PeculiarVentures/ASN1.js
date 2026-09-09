import { describe, expect, it } from "vitest";
import { BaseBlock, fromBER } from "../src";
import { localFromBER } from "../src/parser";

const errors = {
  type: "Wrong parameter: inputBuffer must be 'Uint8Array'",
  empty: "Wrong parameter: inputBuffer has zero length",
  offset: "Wrong parameter: inputOffset less than zero",
  length: "Wrong parameter: inputLength less than zero",
  range: "End of input reached before message was fully decoded (inconsistent offset and length values)",
  zero: "Zero buffer length"
};

describe("localFromBER parameter validation", () => {
  it("reuses the returned BaseBlock for invalid input metadata", () => {
    const result = localFromBER("wrong" as unknown as Uint8Array, 0, 0);
    expect(result.offset).toBe(-1);
    expect(result.result).toBeInstanceOf(BaseBlock);
    expect(result.result.error).toBe(errors.type);
    expect(result.result.idBlock).toBeDefined();
    expect(result.result.lenBlock).toBeDefined();
    expect(result.result.valueBlock).toBeDefined();
  });

  it("preserves exact parameter errors", () => {
    expect(localFromBER(new Uint8Array(), 0, 0).result.error).toBe(errors.empty);
    expect(localFromBER(new Uint8Array(2), -1, 0).result.error).toBe(errors.offset);
    expect(localFromBER(new Uint8Array(2), 0, -1).result.error).toBe(errors.length);
    expect(localFromBER(new Uint8Array(2), 1, 2).result.error).toBe(errors.range);
    expect(localFromBER(new Uint8Array([2, 1, 1]), 0, 0).result.error).toBe(errors.zero);
  });

  it("keeps valid nonzero-offset local parsing and public zero-offset parsing", () => {
    const local = localFromBER(new Uint8Array([0xaa, 2, 1, 1]), 1, 3);
    expect(local.offset).toBe(4);
    expect(local.result.idBlock.tagNumber).toBe(2);
    expect(local.result.lenBlock.length).toBe(1);
    expect(local.result.valueBlock).toBeDefined();

    const publicResult = fromBER(new Uint8Array([2, 1, 1]));
    expect(publicResult.offset).toBe(3);
    expect(publicResult.result.idBlock.tagNumber).toBe(2);

    const publicEmpty = fromBER(new Uint8Array());
    expect(publicEmpty.offset).toBe(-1);
    expect(publicEmpty.result.error).toBe("Input buffer has zero length");
  });
});
