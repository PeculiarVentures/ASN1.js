import * as assert from "assert";
import { test } from "vitest";
import { fromBER, Integer } from "../src";
import { LocalIdentificationBlock } from "../src/internals/LocalIdentificationBlock";
import { LocalLengthBlock } from "../src/internals/LocalLengthBlock";

type Input = ArrayBuffer | Uint8Array;

function inputs(values: number[]): Input[] {
  const view = Uint8Array.from(values);

  return [view, view.buffer];
}

function largeTag(): number[] {
  return [0x1f, ...Array.from({ length: 10 }, () => 0x81), 0x00];
}

test("public fromBER initializes the type store and decodes a header", () => {
  const result = fromBER(Uint8Array.of(0x02, 0x01, 0x7f));

  assert.strictEqual(result.offset, 3);
  assert.ok(result.result instanceof Integer);
  assert.strictEqual(result.result.idBlock.blockLength, 1);
  assert.strictEqual(result.result.lenBlock.blockLength, 1);
});

test("identification headers decode short, long, and large tags from both buffer types", () => {
  for (const input of inputs([0x02])) {
    const block = new LocalIdentificationBlock();

    assert.strictEqual(block.fromBER(input, 0, 1), 1);
    assert.strictEqual(block.tagClass, 1);
    assert.strictEqual(block.tagNumber, 2);
    assert.strictEqual(block.blockLength, 1);
  }

  for (const input of inputs([0x1f, 0x1f])) {
    const block = new LocalIdentificationBlock();

    assert.strictEqual(block.fromBER(input, 0, 2), 2);
    assert.strictEqual(block.tagNumber, 31);
    assert.deepStrictEqual(Array.from(block.valueHexView), [0x1f]);
    assert.strictEqual(block.blockLength, 2);
  }

  for (const input of inputs(largeTag())) {
    const block = new LocalIdentificationBlock();

    assert.strictEqual(block.fromBER(input, 0, input.byteLength), input.byteLength);
    assert.strictEqual(block.isHexOnly, true);
    assert.strictEqual(block.blockLength, input.byteLength);
    assert.strictEqual(block.valueHexView.length, input.byteLength - 1);
    assert.deepStrictEqual(block.warnings, ["Tag too long, represented as hex-coded"]);
  }
});

test("identification headers preserve constructed and truncated error metadata", () => {
  for (const input of inputs([0x25])) {
    const block = new LocalIdentificationBlock();

    assert.strictEqual(block.fromBER(input, 0, 1), -1);
    assert.strictEqual(block.error, "Constructed encoding used for primitive type");
    assert.strictEqual(block.blockLength, 1);
    assert.strictEqual(block.tagClass, 1);
    assert.strictEqual(block.tagNumber, 5);
    assert.strictEqual(block.isConstructed, true);
  }

  for (const input of inputs([0x1f, 0x81])) {
    const block = new LocalIdentificationBlock();

    assert.strictEqual(block.fromBER(input, 0, 2), -1);
    assert.strictEqual(block.error, "End of input reached before message was fully decoded");
    assert.strictEqual(block.blockLength, 0);
  }
});

test("length headers decode short, long, and indefinite forms from both buffer types", () => {
  for (const input of inputs([0x05])) {
    const block = new LocalLengthBlock();

    assert.strictEqual(block.fromBER(input, 0, 1), 1);
    assert.strictEqual(block.length, 5);
    assert.strictEqual(block.longFormUsed, false);
    assert.strictEqual(block.blockLength, 1);
  }

  for (const input of inputs([0x82, 0x01, 0x00])) {
    const block = new LocalLengthBlock();

    assert.strictEqual(block.fromBER(input, 0, 3), 3);
    assert.strictEqual(block.length, 256);
    assert.strictEqual(block.longFormUsed, true);
    assert.strictEqual(block.blockLength, 3);
  }

  for (const input of inputs([0x80])) {
    const block = new LocalLengthBlock();

    assert.strictEqual(block.fromBER(input, 0, 1), 1);
    assert.strictEqual(block.isIndefiniteForm, true);
    assert.strictEqual(block.blockLength, 1);
  }
});

test("length headers preserve reserved and truncated error metadata", () => {
  for (const input of inputs([0xff])) {
    const block = new LocalLengthBlock();

    assert.strictEqual(block.fromBER(input, 0, 1), -1);
    assert.strictEqual(block.error, "Length block 0xFF is reserved by standard");
    assert.strictEqual(block.blockLength, 0);
  }

  for (const input of inputs([0x82, 0x01])) {
    const block = new LocalLengthBlock();

    assert.strictEqual(block.fromBER(input, 0, 2), -1);
    assert.strictEqual(block.error, "End of input reached before message was fully decoded");
    assert.strictEqual(block.blockLength, 0);
  }
});

test("header decoders preserve nonzero offsets on views and array buffers", () => {
  for (const input of inputs([0xaa, 0x1f, 0x81, 0x00, 0x05])) {
    const id = new LocalIdentificationBlock();
    const length = new LocalLengthBlock();

    assert.strictEqual(id.fromBER(input, 1, 3), 4);
    assert.strictEqual(id.tagNumber, 128);
    assert.strictEqual(length.fromBER(input, 4, 1), 5);
    assert.strictEqual(length.length, 5);
  }
});

test("header decoders preserve backing offsets in subarray views", () => {
  const view = Uint8Array.of(0xaa, 0x1f, 0x81, 0x00, 0x05, 0xbb).subarray(1, 5);
  const id = new LocalIdentificationBlock();
  const length = new LocalLengthBlock();

  assert.strictEqual(id.fromBER(view, 0, 3), 3);
  assert.strictEqual(id.tagNumber, 128);
  assert.strictEqual(length.fromBER(view, 3, 1), 4);
  assert.strictEqual(length.length, 5);
});

test("header decoders preserve repeated state fields", () => {
  const id = new LocalIdentificationBlock();

  assert.strictEqual(id.fromBER(Uint8Array.of(0x1f, 0x1f), 0, 2), 2);
  assert.deepStrictEqual(Array.from(id.valueHexView), [31]);
  assert.strictEqual(id.fromBER(Uint8Array.of(0x02), 0, 1), 1);
  assert.strictEqual(id.tagNumber, 2);
  assert.strictEqual(id.blockLength, 1);
  assert.deepStrictEqual(Array.from(id.valueHexView), [31]);

  const length = new LocalLengthBlock();

  assert.strictEqual(length.fromBER(Uint8Array.of(0x82, 0x01, 0x00), 0, 3), 3);
  assert.strictEqual(length.length, 256);
  assert.deepStrictEqual(length.warnings, ["Needlessly long encoded length"]);
  assert.strictEqual(length.fromBER(Uint8Array.of(0x05), 0, 1), 1);
  assert.strictEqual(length.length, 5);
  assert.strictEqual(length.longFormUsed, false);
  assert.deepStrictEqual(length.warnings, ["Needlessly long encoded length"]);
});

test("header decoders preserve unusual argument normalization", () => {
  const idFractional = new LocalIdentificationBlock();
  assert.strictEqual(idFractional.fromBER(Uint8Array.of(9, 2), 0.5, 1), 1.5);
  assert.strictEqual(idFractional.tagNumber, 9);

  const lengthFractional = new LocalLengthBlock();
  assert.strictEqual(lengthFractional.fromBER(Uint8Array.of(3, 5), 0.5, 1), 1.5);
  assert.strictEqual(lengthFractional.length, 3);

  const idNaN = new LocalIdentificationBlock();
  assert.strictEqual(idNaN.fromBER(Uint8Array.of(2), Number.NaN, 1), -1);
  assert.strictEqual(idNaN.error, "Zero buffer length");

  const lengthNaN = new LocalLengthBlock();
  assert.strictEqual(lengthNaN.fromBER(Uint8Array.of(5), 0, Number.NaN), -1);
  assert.strictEqual(lengthNaN.error, "Zero buffer length");
});
