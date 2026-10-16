import * as assert from "assert";
import { describe, it } from "vitest";
import { concat } from "../src/internals/utils";
import { ViewWriter } from "../src/ViewWriter";

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

describe("ViewWriter buffer behavior", () => {
  it("snapshots Uint8Array writes and aliases ArrayBuffer writes", () => {
    const writer = new ViewWriter();
    const view = Uint8Array.of(1, 2);
    const arrayBuffer = Uint8Array.of(3, 4).buffer;

    writer.write(view);
    writer.write(arrayBuffer);
    view[0] = 9;
    new Uint8Array(arrayBuffer)[0] = 8;

    assert.deepStrictEqual(bytes(writer.final()), [1, 2, 8, 4]);
  });

  it("uses the current items array and its buffers", () => {
    const writer = new ViewWriter();
    const first = Uint8Array.of(1).buffer;
    const second = Uint8Array.of(2).buffer;
    const replacement = Uint8Array.of(3).buffer;

    writer.items.push(first, second);
    writer.items.splice(0, 1, replacement);
    writer.items.reverse();
    writer.items[1] = first;
    assert.deepStrictEqual(bytes(writer.final()), [2, 1]);

    const writtenWriter = new ViewWriter();
    writtenWriter.write(Uint8Array.of(4));
    new Uint8Array(writtenWriter.items[0])[0] = 5;
    assert.deepStrictEqual(bytes(writtenWriter.final()), [5]);
  });

  it("allocates a fresh result for each final call", () => {
    const writer = new ViewWriter();
    writer.items.push(Uint8Array.of(1, 2).buffer);

    const first = writer.final();
    const second = writer.final();

    assert.notStrictEqual(first, second);
    assert.deepStrictEqual(bytes(first), [1, 2]);
    assert.deepStrictEqual(bytes(second), [1, 2]);
  });
});
