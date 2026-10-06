import * as assert from "assert";
import { describe, it } from "vitest";
import { OctetString, Sequence, ViewWriter } from "../src";
import { tryEncodeBuiltin } from "../src/internals/BEREncoder";

const OCTET_BER = [0x04, 0x01, 0x11];
const SEQUENCE_BER = [0x30, 0x03, 0x04, 0x01, 0x11];

function bytes(buffer: ArrayBuffer): number[] {
  return Array.from(new Uint8Array(buffer));
}

function freshOctet(): OctetString {
  return new OctetString({ valueHex: Uint8Array.of(0x11) });
}

function freshSequence(): Sequence {
  return new Sequence({ value: [freshOctet()] });
}

function installMutatingByteLengthGetter(value: OctetString): { readonly reads: number; restore: () => void } {
  const view = value.valueBlock.valueHexView;
  const buffer = view.buffer as ArrayBuffer;
  const originalDescriptor = Object.getOwnPropertyDescriptor(buffer, "byteLength");
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

  return {
    get reads() {
      return reads;
    },
    restore: () => {
      if (originalDescriptor) Object.defineProperty(buffer, "byteLength", originalDescriptor);
      else Reflect.deleteProperty(buffer, "byteLength");
    }
  };
}

function installOwnByteLengthDataProperty(value: OctetString): () => void {
  const buffer = value.valueBlock.valueHexView.buffer as ArrayBuffer;
  const originalDescriptor = Object.getOwnPropertyDescriptor(buffer, "byteLength");
  const realByteLength = buffer.byteLength;

  Object.defineProperty(buffer, "byteLength", {
    configurable: true,
    value: realByteLength
  });

  return () => {
    if (originalDescriptor) Object.defineProperty(buffer, "byteLength", originalDescriptor);
    else Reflect.deleteProperty(buffer, "byteLength");
  };
}

describe("built-in BER encoder backing buffer checks", () => {
  it("preserves a primitive OCTET STRING with an own backing byteLength getter", () => {
    const value = freshOctet();
    const probe = installMutatingByteLengthGetter(value);
    try {
      assert.deepStrictEqual(bytes(value.toBER()), OCTET_BER);
      assert.strictEqual(probe.reads, 0);
      assert.deepStrictEqual(Array.from(value.valueBlock.valueHexView), [0x11]);
    } finally {
      probe.restore();
    }

    const legacyValue = freshOctet();
    const legacyProbe = installMutatingByteLengthGetter(legacyValue);
    try {
      const writer = new ViewWriter();
      assert.strictEqual(legacyValue.toBER(false, writer).byteLength, 0);
      assert.deepStrictEqual(bytes(writer.final()), OCTET_BER);
      assert.strictEqual(legacyProbe.reads, 0);
      assert.deepStrictEqual(Array.from(legacyValue.valueBlock.valueHexView), [0x11]);
    } finally {
      legacyProbe.restore();
    }
  });

  it("preserves a single-child SEQUENCE with an own backing byteLength getter", () => {
    const value = freshSequence();
    const child = value.valueBlock.value[0] as OctetString;
    const probe = installMutatingByteLengthGetter(child);
    try {
      assert.deepStrictEqual(bytes(value.toBER()), SEQUENCE_BER);
      assert.strictEqual(probe.reads, 0);
      assert.deepStrictEqual(Array.from(child.valueBlock.valueHexView), [0x11]);
    } finally {
      probe.restore();
    }

    const legacyValue = freshSequence();
    const legacyChild = legacyValue.valueBlock.value[0] as OctetString;
    const legacyProbe = installMutatingByteLengthGetter(legacyChild);
    try {
      const writer = new ViewWriter();
      assert.strictEqual(legacyValue.toBER(false, writer).byteLength, 0);
      assert.deepStrictEqual(bytes(writer.final()), SEQUENCE_BER);
      assert.strictEqual(legacyProbe.reads, 0);
      assert.deepStrictEqual(Array.from(legacyChild.valueBlock.valueHexView), [0x11]);
    } finally {
      legacyProbe.restore();
    }
  });

  it("rejects a primitive OCTET STRING during eligibility without reading backing byteLength", () => {
    const value = freshOctet();
    const probe = installMutatingByteLengthGetter(value);
    try {
      assert.strictEqual(tryEncodeBuiltin(value), undefined);
      assert.strictEqual(probe.reads, 0);
      assert.deepStrictEqual(Array.from(value.valueBlock.valueHexView), [0x11]);
    } finally {
      probe.restore();
    }
  });

  it("rejects a single-child SEQUENCE during eligibility without reading backing byteLength", () => {
    const value = freshSequence();
    const child = value.valueBlock.value[0] as OctetString;
    const probe = installMutatingByteLengthGetter(child);
    try {
      assert.strictEqual(tryEncodeBuiltin(value), undefined);
      assert.strictEqual(probe.reads, 0);
      assert.deepStrictEqual(Array.from(child.valueBlock.valueHexView), [0x11]);
    } finally {
      probe.restore();
    }
  });

  it("falls back for an own backing byteLength data property", () => {
    const value = freshOctet();
    const restore = installOwnByteLengthDataProperty(value);
    try {
      assert.strictEqual(tryEncodeBuiltin(value), undefined);
      assert.deepStrictEqual(bytes(value.toBER()), OCTET_BER);
      assert.deepStrictEqual(Array.from(value.valueBlock.valueHexView), [0x11]);
    } finally {
      restore();
    }
  });
});
