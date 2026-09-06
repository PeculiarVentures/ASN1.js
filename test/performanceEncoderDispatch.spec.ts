import * as assert from "assert";
import { describe, it } from "vitest";
import { BaseBlock, OctetString, Sequence, ViewWriter } from "../src";
import { shouldUseBuiltinEncoder, tryEncodeBuiltin } from "../src/internals/BEREncoder";

const DISPATCH_THRESHOLD = 16_384;

function bytes(buffer: ArrayBuffer): number[] {
  return Array.from(new Uint8Array(buffer));
}

function lengthBytes(length: number): number[] {
  if (length < 128) return [length];
  const encoded: number[] = [];
  for (let value = length; value > 0; value = Math.floor(value / 256)) encoded.unshift(value & 0xff);
  return [0x80 | encoded.length, ...encoded];
}

function octet(length: number, fill = 0x11): OctetString {
  return new OctetString({ valueHex: new Uint8Array(length).fill(fill) });
}

function sequence(...values: BaseBlock[]): Sequence {
  return new Sequence({ value: values });
}

function nestedSequence(depth: number, leaf: BaseBlock): Sequence {
  let current = leaf;
  for (let index = 0; index < depth; index += 1) current = sequence(current);
  return current as Sequence;
}

function octetBER(value: OctetString): number[] {
  return [0x04, ...lengthBytes(value.valueBlock.valueHexView.length), ...Array.from(value.valueBlock.valueHexView)];
}

function restoreDescriptor(object: object, name: PropertyKey, descriptor: PropertyDescriptor | undefined): void {
  if (descriptor) Object.defineProperty(object, name, descriptor);
  else Reflect.deleteProperty(object, name);
}

describe("built-in BER encoder dispatch heuristic", () => {
  it("rejects small primitive, one-child, and multi-child shapes", () => {
    assert.strictEqual(shouldUseBuiltinEncoder(octet(1)), false);
    assert.strictEqual(shouldUseBuiltinEncoder(sequence(octet(1))), false);

    const multiChild = sequence(octet(1), octet(1));
    const descriptor = Object.getOwnPropertyDescriptor(multiChild, "idBlock");
    let headerReads = 0;
    Object.defineProperty(multiChild, "idBlock", {
      configurable: true,
      get: () => {
        headerReads += 1;
        return descriptor && "value" in descriptor ? descriptor.value : undefined;
      }
    });
    try {
      assert.strictEqual(shouldUseBuiltinEncoder(multiChild), false);
      assert.strictEqual(headerReads, 0);
    } finally {
      restoreDescriptor(multiChild, "idBlock", descriptor);
    }
  });

  it("uses the threshold boundary and caps chain traversal", () => {
    assert.strictEqual(shouldUseBuiltinEncoder(octet(DISPATCH_THRESHOLD - 1)), false);
    assert.strictEqual(shouldUseBuiltinEncoder(octet(DISPATCH_THRESHOLD)), true);
    assert.strictEqual(shouldUseBuiltinEncoder(nestedSequence(64, octet(DISPATCH_THRESHOLD))), true);
    assert.strictEqual(shouldUseBuiltinEncoder(nestedSequence(65, octet(DISPATCH_THRESHOLD))), false);
  });

  it("uses the optimized path for large primitive payloads and preserves mutations", () => {
    const value = octet(DISPATCH_THRESHOLD);
    assert.strictEqual(shouldUseBuiltinEncoder(value), true);

    const direct = tryEncodeBuiltin(value);
    assert.ok(direct instanceof ArrayBuffer);
    assert.deepStrictEqual(bytes(value.toBER()), bytes(direct));

    value.valueBlock.valueHexView[0] = 0x22;
    const mutated = tryEncodeBuiltin(value);
    assert.ok(mutated instanceof ArrayBuffer);
    assert.deepStrictEqual(bytes(value.toBER()), bytes(mutated));

    const writer = new ViewWriter();
    assert.strictEqual(value.toBER(false, writer).byteLength, 0);
    assert.deepStrictEqual(bytes(writer.final()), bytes(mutated));
  });

  it("uses the optimized path for large single-child chains", () => {
    const child = octet(DISPATCH_THRESHOLD);
    const value = sequence(child);
    assert.strictEqual(shouldUseBuiltinEncoder(value), true);

    const direct = tryEncodeBuiltin(value);
    assert.ok(direct instanceof ArrayBuffer);
    assert.deepStrictEqual(bytes(value.toBER()), bytes(direct));

    child.valueBlock.valueHexView[0] = 0x33;
    const mutated = tryEncodeBuiltin(value);
    assert.ok(mutated instanceof ArrayBuffer);
    assert.deepStrictEqual(bytes(value.toBER()), bytes(mutated));

    const writer = new ViewWriter();
    assert.strictEqual(value.toBER(false, writer).byteLength, 0);
    assert.deepStrictEqual(bytes(writer.final()), bytes(mutated));
  });

  it("does not invoke custom accessors while deciding dispatch", () => {
    const value = octet(DISPATCH_THRESHOLD);
    const blockDescriptor = Object.getOwnPropertyDescriptor(value, "valueBlock");
    const valueBlock = value.valueBlock;
    let blockReads = 0;
    Object.defineProperty(value, "valueBlock", {
      configurable: true,
      get: () => {
        blockReads += 1;
        return valueBlock;
      }
    });
    try {
      assert.strictEqual(shouldUseBuiltinEncoder(value), false);
      assert.strictEqual(blockReads, 0);
    } finally {
      restoreDescriptor(value, "valueBlock", blockDescriptor);
    }

    const payload = octet(DISPATCH_THRESHOLD);
    const payloadDescriptor = Object.getOwnPropertyDescriptor(payload.valueBlock, "valueHexView");
    const payloadView = payload.valueBlock.valueHexView;
    let payloadReads = 0;
    Object.defineProperty(payload.valueBlock, "valueHexView", {
      configurable: true,
      get: () => {
        payloadReads += 1;
        return payloadView;
      }
    });
    try {
      assert.strictEqual(shouldUseBuiltinEncoder(payload), false);
      assert.strictEqual(payloadReads, 0);
    } finally {
      restoreDescriptor(payload.valueBlock, "valueHexView", payloadDescriptor);
    }

    const indexed = sequence(octet(DISPATCH_THRESHOLD));
    const values = indexed.valueBlock.value;
    const indexDescriptor = Object.getOwnPropertyDescriptor(values, "0");
    let indexReads = 0;
    Object.defineProperty(values, "0", {
      configurable: true,
      get: () => {
        indexReads += 1;
        return indexDescriptor && "value" in indexDescriptor ? indexDescriptor.value : undefined;
      }
    });
    try {
      assert.strictEqual(shouldUseBuiltinEncoder(indexed), false);
      assert.strictEqual(indexReads, 0);
    } finally {
      restoreDescriptor(values, "0", indexDescriptor);
    }

    const typedArray = octet(DISPATCH_THRESHOLD);
    const typedArrayView = typedArray.valueBlock.valueHexView;
    const typedArrayDescriptor = Object.getOwnPropertyDescriptor(typedArrayView, "byteLength");
    let typedArrayReads = 0;
    Object.defineProperty(typedArrayView, "byteLength", {
      configurable: true,
      get: () => {
        typedArrayReads += 1;
        return DISPATCH_THRESHOLD;
      }
    });
    try {
      assert.strictEqual(shouldUseBuiltinEncoder(typedArray), true);
      assert.strictEqual(typedArrayReads, 0);
    } finally {
      restoreDescriptor(typedArrayView, "byteLength", typedArrayDescriptor);
    }
  });

  it("falls back safely for a large leaf with an own backing byteLength property", () => {
    const value = octet(DISPATCH_THRESHOLD);
    const view = value.valueBlock.valueHexView;
    const buffer = view.buffer as ArrayBuffer;
    const descriptor = Object.getOwnPropertyDescriptor(buffer, "byteLength");
    const realByteLength = buffer.byteLength;
    let reads = 0;
    Object.defineProperty(buffer, "byteLength", {
      configurable: true,
      get: () => {
        reads += 1;
        view[0] = 0x22;
        return realByteLength;
      }
    });
    try {
      assert.strictEqual(shouldUseBuiltinEncoder(value), true);
      assert.strictEqual(reads, 0);
      assert.strictEqual(tryEncodeBuiltin(value), undefined);
      assert.strictEqual(reads, 0);
      assert.deepStrictEqual(bytes(value.toBER()), octetBER(value));
      assert.strictEqual(reads, 0);
      assert.strictEqual(view[0], 0x11);
    } finally {
      restoreDescriptor(buffer, "byteLength", descriptor);
    }
  });
});
