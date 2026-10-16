import * as assert from "assert";
import { BaseBlock } from "../BaseBlock";
import { checkBufferParams, concat } from "./utils";
import { describe, it } from "vitest";

function bytes(buffer: ArrayBuffer): number[] {
  return Array.from(new Uint8Array(buffer));
}

describe("concat performance behavior", () => {
  it("concatenates empty, mixed, and sliced buffers", () => {
    assert.ok(concat([]) instanceof ArrayBuffer);
    assert.strictEqual(concat([]).byteLength, 0);

    const arrayBuffer = Uint8Array.of(1, 2).buffer;
    const view = Uint8Array.of(3, 4);
    assert.deepStrictEqual(bytes(concat([arrayBuffer, view])), [1, 2, 3, 4]);

    const source = Uint8Array.of(0, 1, 2, 3, 4);
    const subarray = source.subarray(1, 4);
    const nodeBuffer = Buffer.from([5, 6, 7, 8]).slice(1, 3);
    assert.deepStrictEqual(bytes(concat([subarray, nodeBuffer])), [1, 2, 3, 6, 7]);
  });

  it("copies source views into an owned result", () => {
    const source = Uint8Array.of(1, 2, 3);
    const sourceBuffer = Uint8Array.of(4, 5).buffer;
    const result = concat([source, sourceBuffer]);

    source[0] = 9;
    new Uint8Array(sourceBuffer)[0] = 8;

    assert.deepStrictEqual(bytes(result), [1, 2, 3, 4, 5]);
  });
});

describe("utils", () => {
  it("buffer incorrect type", () => {
    const buffer = "wrong";
    const block = new BaseBlock();
    const res = checkBufferParams(block, buffer as unknown as Uint8Array, 0, 0);
    assert.strictEqual(res, false);
  });
  it("buffer 0 length", () => {
    const buffer = new Uint8Array();
    const block = new BaseBlock();
    const res = checkBufferParams(block, buffer, 0, 0);
    assert.strictEqual(res, false);
  });
  it("offset is negative", () => {
    const buffer = new Uint8Array(10);
    const block = new BaseBlock();
    const res = checkBufferParams(block, buffer, -1, 0);
    assert.strictEqual(res, false);
  });
  it("length is negative", () => {
    const buffer = new Uint8Array(10);
    const block = new BaseBlock();
    const res = checkBufferParams(block, buffer, 0, -1);
    assert.strictEqual(res, false);
  });
  it("out of range", () => {
    const buffer = new Uint8Array(10);
    const block = new BaseBlock();
    const res = checkBufferParams(block, buffer, 8, 3);
    assert.strictEqual(res, false);
  });
});
