import * as assert from "assert";
import { describe, it } from "vitest";
import * as asn1js from "../src";
import {
  BaseBlock,
  BitString,
  Constructed,
  Integer,
  OctetString,
  Primitive,
  Sequence,
  Set,
  ViewWriter,
  fromBER
} from "../src";
import { registerBuiltinEncoder, tryEncodeBuiltin } from "../src/internals/BEREncoder";
import { LocalOctetStringValueBlock } from "../src/internals/LocalOctetStringValueBlock";

function bytes(buffer: ArrayBuffer): number[] {
  return Array.from(new Uint8Array(buffer));
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.byteLength, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result;
}

function lengthBytes(length: number): Uint8Array {
  if (length < 128) return Uint8Array.of(length);
  const encoded: number[] = [];
  for (let value = length; value > 0; value = Math.floor(value / 256)) encoded.unshift(value % 256);
  return Uint8Array.of(0x80 | encoded.length, ...encoded);
}

function octetString(length: number): Uint8Array {
  return concat(Uint8Array.of(0x04), lengthBytes(length), new Uint8Array(length).fill(0x5a));
}

function nestedSequence(depth: number): Uint8Array {
  let result = octetString(1);
  for (let index = 0; index < depth; index += 1) {
    result = concat(Uint8Array.of(0x30), lengthBytes(result.byteLength), result);
  }
  return result;
}

function decode(input: number[]): OctetString | Integer | Sequence | Set {
  const result = fromBER(Uint8Array.from(input));
  assert.notStrictEqual(result.offset, -1);
  return result.result as OctetString | Integer | Sequence | Set;
}

function decodeBit(input: number[]): BitString {
  const result = fromBER(Uint8Array.from(input));
  assert.notStrictEqual(result.offset, -1);
  return result.result as BitString;
}

describe("built-in BER encoder", () => {
  it("preserves primitive bytes and long lengths", () => {
    const payload = Array.from({ length: 256 }, (_, index) => index & 0xff);
    const value = decode([0x04, 0x82, 0x01, 0x00, ...payload]) as OctetString;

    assert.deepStrictEqual(bytes(value.toBER()), [0x04, 0x82, 0x01, 0x00, ...payload]);
    assert.strictEqual(value.lenBlock.length, 256);
  });

  it("encodes a single-child chain without changing the tree", () => {
    const value = decode([0x30, 0x07, 0x31, 0x05, 0x04, 0x03, 1, 2, 3]) as Sequence;
    const before = value.valueBlock.value[0];

    const direct = tryEncodeBuiltin(value);
    assert.ok(direct instanceof ArrayBuffer);
    assert.deepStrictEqual(bytes(direct), [0x30, 0x07, 0x31, 0x05, 0x04, 0x03, 1, 2, 3]);
    assert.deepStrictEqual(bytes(value.toBER()), [0x30, 0x07, 0x31, 0x05, 0x04, 0x03, 1, 2, 3]);
    assert.strictEqual(value.valueBlock.value[0], before);
    assert.deepStrictEqual(bytes(value.toBER()), [0x30, 0x07, 0x31, 0x05, 0x04, 0x03, 1, 2, 3]);
  });

  it("reads payload subarrays and reflects mutations on the next call", () => {
    const source = Uint8Array.from([0xaa, 0x04, 0x02, 0x10, 0x11, 0xbb]);
    const result = fromBER(source.subarray(1, 5));
    assert.strictEqual(result.offset, 4);
    const value = result.result as OctetString;

    assert.deepStrictEqual(bytes(value.toBER()), [0x04, 0x02, 0x10, 0x11]);
    value.valueBlock.valueHexView[0] = 0x22;
    assert.deepStrictEqual(bytes(value.toBER()), [0x04, 0x02, 0x22, 0x11]);
  });

  it("uses the legacy path for custom serializers and multiple children", () => {
    const customRoot = decode([0x30, 0x03, 0x04, 0x01, 0x01]) as Sequence;
    const custom = customRoot.valueBlock.value[0] as OctetString;
    const original = custom.toBER.bind(custom);
    custom.toBER = (sizeOnly?: boolean, writer?: ViewWriter): ArrayBuffer => original(sizeOnly, writer);
    assert.deepStrictEqual(bytes(customRoot.toBER()), [0x30, 0x03, 0x04, 0x01, 0x01]);

    class CustomOctetString extends OctetString {}
    const customSubclass = new CustomOctetString({ valueHex: Uint8Array.of(7), isHexOnly: true });
    assert.deepStrictEqual(bytes(customSubclass.toBER()), [0x04, 0x01, 0x07]);

    const two = decode([0x30, 0x06, 0x04, 0x01, 0x01, 0x04, 0x01, 0x02]) as Sequence;
    const previous = two.valueBlock.value[0] as OctetString;
    const next = two.valueBlock.value[1] as OctetString;
    const nextOriginal = next.toBER.bind(next);
    next.toBER = (sizeOnly?: boolean, writer?: ViewWriter): ArrayBuffer => {
      previous.valueBlock.valueHexView[0] = 9;
      return nextOriginal(sizeOnly, writer);
    };
    assert.deepStrictEqual(bytes(two.toBER()), [0x30, 0x06, 0x04, 0x01, 0x01, 0x04, 0x01, 0x02]);
  });

  it("falls back without invoking an own value serializer during eligibility", () => {
    const root = decode([0x30, 0x03, 0x04, 0x01, 0x01]) as Sequence;
    const child = root.valueBlock.value[0] as OctetString;
    const original = child.valueBlock.toBER.bind(child.valueBlock);
    let getterCalls = 0;
    Object.defineProperty(child.valueBlock, "toBER", {
      configurable: true,
      get: () => {
        getterCalls += 1;
        return original;
      }
    });

    assert.deepStrictEqual(bytes(root.toBER()), [0x30, 0x03, 0x04, 0x01, 0x01]);
    assert.strictEqual(getterCalls, 1);
  });

  it("falls back for an own payload constructor accessor", () => {
    const root = decode([0x30, 0x03, 0x04, 0x01, 0x01]) as Sequence;
    const child = root.valueBlock.value[0] as OctetString;
    let constructorCalls = 0;
    Object.defineProperty(child.valueBlock.valueHexView, "constructor", {
      configurable: true,
      get: () => {
        constructorCalls += 1;
        return Uint8Array;
      }
    });

    assert.strictEqual(tryEncodeBuiltin(root), undefined);
    assert.strictEqual(constructorCalls, 0);
    assert.deepStrictEqual(bytes(root.toBER()), [0x30, 0x03, 0x04, 0x01, 0x01]);
    assert.strictEqual(constructorCalls, 1);
  });

  it("falls back for id and length method overrides", () => {
    for (const field of ["idBlock", "lenBlock"] as const) {
      const root = decode([0x30, 0x03, 0x04, 0x01, 0x01]) as Sequence;
      const child = root.valueBlock.value[0] as OctetString;
      const block = child[field];
      const original = block.toBER.bind(block);
      block.toBER = (sizeOnly?: boolean): ArrayBuffer => original(sizeOnly);

      assert.deepStrictEqual(bytes(root.toBER()), [0x30, 0x03, 0x04, 0x01, 0x01]);
    }
  });

  it("keeps original encoder references across late registration", () => {
    const source = Uint8Array.of(0x30, 0x03, 0x04, 0x01, 0x01);
    const value = fromBER(source).result as Sequence;
    const baseDescriptor = Object.getOwnPropertyDescriptor(asn1js.BaseBlock.prototype, "toBER");
    const valueDescriptor = Object.getOwnPropertyDescriptor(LocalOctetStringValueBlock.prototype, "toBER");
    const writerDescriptor = Object.getOwnPropertyDescriptor(ViewWriter.prototype, "write");
    assert.ok(baseDescriptor && "value" in baseDescriptor);
    assert.ok(valueDescriptor && "value" in valueDescriptor);
    assert.ok(writerDescriptor && "value" in writerDescriptor);

    const originalBase = baseDescriptor.value as BaseBlock["toBER"];
    const originalValue = valueDescriptor.value as LocalOctetStringValueBlock["toBER"];
    const originalWrite = writerDescriptor.value as ViewWriter["write"];
    let baseCalls = 0;
    let valueCalls = 0;
    let writerCalls = 0;
    Object.defineProperty(asn1js.BaseBlock.prototype, "toBER", {
      ...baseDescriptor,
      value: function (this: BaseBlock, ...args: Parameters<BaseBlock["toBER"]>) {
        baseCalls += 1;
        return Reflect.apply(originalBase, this, args);
      }
    });
    Object.defineProperty(LocalOctetStringValueBlock.prototype, "toBER", {
      ...valueDescriptor,
      value: function (this: LocalOctetStringValueBlock, ...args: Parameters<LocalOctetStringValueBlock["toBER"]>) {
        valueCalls += 1;
        return Reflect.apply(originalValue, this, args);
      }
    });
    Object.defineProperty(ViewWriter.prototype, "write", {
      ...writerDescriptor,
      value: function (this: ViewWriter, ...args: Parameters<ViewWriter["write"]>) {
        writerCalls += 1;
        return Reflect.apply(originalWrite, this, args);
      }
    });
    try {
      registerBuiltinEncoder({ BitString, Integer, OctetString, Primitive, Constructed, Sequence, Set });
      assert.deepStrictEqual(bytes(value.toBER()), Array.from(source));
      assert.ok(baseCalls > 0);
      assert.ok(valueCalls > 0);
      assert.ok(writerCalls > 0);
      for (const name of [
        "ORIGINAL_BASE_BLOCK_TO_BER",
        "ORIGINAL_VIEW_WRITER_WRITE",
        "ORIGINAL_VIEW_WRITER_FINAL",
        "ORIGINAL_LOCAL_IDENTIFICATION_TO_BER",
        "ORIGINAL_LOCAL_LENGTH_TO_BER",
        "ORIGINAL_LOCAL_INTEGER_TO_BER",
        "ORIGINAL_LOCAL_OCTET_STRING_TO_BER",
        "ORIGINAL_LOCAL_CONSTRUCTED_TO_BER",
        "ORIGINAL_LOCAL_BIT_STRING_TO_BER",
        "ORIGINAL_LOCAL_PRIMITIVE_TO_BER"
      ]) {
        assert.strictEqual(Object.prototype.hasOwnProperty.call(asn1js, name), false, name);
      }
    } finally {
      Object.defineProperty(asn1js.BaseBlock.prototype, "toBER", baseDescriptor);
      Object.defineProperty(LocalOctetStringValueBlock.prototype, "toBER", valueDescriptor);
      Object.defineProperty(ViewWriter.prototype, "write", writerDescriptor);
      registerBuiltinEncoder({ BitString, Integer, OctetString, Primitive, Constructed, Sequence, Set });
    }
  });

  it("preserves nested depth and length boundary encodings", () => {
    for (const depth of [0, 4, 16, 32]) {
      const source = nestedSequence(depth);
      const value = fromBER(source).result as Sequence | OctetString;
      const expected = Array.from(source);
      const first = value.toBER();
      assert.deepStrictEqual(bytes(first), expected);
      const length = value.lenBlock.length;
      assert.deepStrictEqual(bytes(value.toBER()), expected);
      assert.strictEqual(value.lenBlock.length, length);
    }

    for (const length of [127, 128, 255, 256, 65535, 65536]) {
      const source = octetString(length);
      const value = fromBER(source).result as OctetString;
      const expected = Array.from(source);
      assert.deepStrictEqual(bytes(value.toBER()), expected);
      assert.strictEqual(value.lenBlock.length, length);
      assert.deepStrictEqual(bytes(value.toBER()), expected);
    }
  });

  it("preserves indefinite and mixed one-child chains", () => {
    const indefinite = Uint8Array.of(0x30, 0x80, 0x04, 0x01, 0x01, 0x00, 0x00);
    const indefiniteValue = fromBER(indefinite).result as Sequence;
    assert.deepStrictEqual(bytes(indefiniteValue.toBER()), Array.from(indefinite));

    const mixed = Uint8Array.of(0x30, 0x07, 0x30, 0x80, 0x04, 0x01, 0x01, 0x00, 0x00);
    const mixedValue = fromBER(mixed).result as Sequence;
    const child = mixedValue.valueBlock.value[0] as Sequence;
    assert.strictEqual(mixedValue.lenBlock.length, 7);
    assert.strictEqual(child.lenBlock.length, 0);

    const expected = [0x30, 0x80, 0x30, 0x80, 0x04, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00];
    assert.deepStrictEqual(bytes(mixedValue.toBER()), expected);
    assert.strictEqual(mixedValue.lenBlock.length, 7);
    assert.strictEqual(child.lenBlock.length, 0);
    assert.strictEqual(mixedValue.lenBlock.isIndefiniteForm, true);

    const direct = tryEncodeBuiltin(mixedValue);
    assert.ok(direct instanceof ArrayBuffer);
    assert.deepStrictEqual(bytes(direct), expected);

    const leaf = child.valueBlock.value[0] as OctetString;
    leaf.valueBlock.valueHexView[0] = 2;
    const mutated = [0x30, 0x80, 0x30, 0x80, 0x04, 0x01, 0x02, 0x00, 0x00, 0x00, 0x00];
    assert.deepStrictEqual(bytes(mixedValue.toBER()), mutated);
    assert.deepStrictEqual(bytes(mixedValue.toBER()), mutated);
    assert.strictEqual(mixedValue.lenBlock.length, 7);
    assert.strictEqual(child.lenBlock.length, 0);

    assert.deepStrictEqual(
      bytes(mixedValue.toBER(true)),
      [0x00, 0x80, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
    );
  });

  it("encodes primitive BIT STRING prefixes without joining the payload", () => {
    for (const unusedBits of [0, 1, 7]) {
      const value = decodeBit([0x03, 0x03, unusedBits, 0xa5, 0x03]);
      assert.deepStrictEqual(bytes(value.toBER()), [0x03, 0x03, unusedBits, 0xa5, 0x03]);
    }

    const value = decodeBit([0x03, 0x02, 0x01, 0xa5]);
    value.valueBlock.unusedBits = 7;
    value.valueBlock.valueHexView[0] = 0x5a;
    assert.deepStrictEqual(bytes(value.toBER()), [0x03, 0x02, 0x07, 0x5a]);
    assert.deepStrictEqual(bytes(value.toBER()), [0x03, 0x02, 0x07, 0x5a]);

    const empty = decodeBit([0x03, 0x01, 0x00]);
    empty.valueBlock.unusedBits = 5;
    assert.deepStrictEqual(bytes(empty.toBER()), [0x03, 0x01, 0x00]);
    assert.ok(tryEncodeBuiltin(value) instanceof ArrayBuffer);
    assert.ok(tryEncodeBuiltin(empty) instanceof ArrayBuffer);
  });

  it("wraps BIT STRING in definite and indefinite chains", () => {
    const definite = decode([0x30, 0x04, 0x03, 0x02, 0x01, 0xa5]) as Sequence;
    assert.deepStrictEqual(bytes(definite.toBER()), [0x30, 0x04, 0x03, 0x02, 0x01, 0xa5]);

    const indefinite = Uint8Array.of(0x30, 0x80, 0x03, 0x02, 0x01, 0xa5, 0x00, 0x00);
    const value = fromBER(indefinite).result as Sequence;
    assert.deepStrictEqual(bytes(value.toBER()), Array.from(indefinite));
  });

  it("keeps constructed and customized BIT STRING on the legacy path", () => {
    const constructed = Uint8Array.of(0x23, 0x03, 0x03, 0x01, 0x00);
    const value = fromBER(constructed).result as BitString;
    assert.deepStrictEqual(bytes(value.toBER()), Array.from(constructed));

    const root = decode([0x30, 0x04, 0x03, 0x02, 0x01, 0xa5]) as Sequence;
    const child = root.valueBlock.value[0] as BitString;
    const original = child.valueBlock.toBER.bind(child.valueBlock);
    child.valueBlock.toBER = (sizeOnly?: boolean, writer?: ViewWriter): ArrayBuffer => original(sizeOnly, writer);
    assert.strictEqual(tryEncodeBuiltin(root), undefined);
    assert.deepStrictEqual(bytes(root.toBER()), [0x30, 0x04, 0x03, 0x02, 0x01, 0xa5]);
  });

  it("keeps constructed OCTET STRING and size-only indefinite encoding on legacy paths", () => {
    const constructed = Uint8Array.of(0x24, 0x80, 0x04, 0x01, 0x01, 0x00, 0x00);
    const value = fromBER(constructed).result as OctetString;
    assert.deepStrictEqual(bytes(value.toBER()), Array.from(constructed));

    const indefinite = fromBER(Uint8Array.of(0x30, 0x80, 0x04, 0x01, 0x01, 0x00, 0x00)).result as Sequence;
    assert.deepStrictEqual(bytes(indefinite.toBER(true)), [0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00]);
  });

  it("keeps size-only and external-writer behavior", () => {
    const value = decode([0x04, 0x02, 0x01, 0x02]) as OctetString;
    const sizeOnly = value.toBER(true);
    assert.ok(sizeOnly instanceof ArrayBuffer);
    assert.strictEqual(sizeOnly.byteLength, 4);

    const writer = new ViewWriter();
    assert.strictEqual(value.toBER(false, writer).byteLength, 0);
    assert.deepStrictEqual(bytes(writer.final()), [0x04, 0x02, 0x01, 0x02]);
  });

  it("uses one final zero-filled buffer for supported size-only trees", () => {
    for (const depth of [0, 4, 16, 32]) {
      const source = nestedSequence(depth);
      const value = fromBER(source).result as Sequence | OctetString;
      assert.deepStrictEqual(
        bytes(value.toBER(true)),
        Array.from({ length: source.byteLength }, () => 0)
      );
      const length = value.lenBlock.length;
      assert.deepStrictEqual(
        bytes(value.toBER(true)),
        Array.from({ length: source.byteLength }, () => 0)
      );
      assert.strictEqual(value.lenBlock.length, length);
    }

    const large = fromBER(octetString(256)).result as OctetString;
    assert.deepStrictEqual(
      bytes(large.toBER(true)),
      Array.from({ length: 260 }, () => 0)
    );

    const longTag = new Primitive({
      idBlock: { tagClass: 2, tagNumber: 31 },
      valueHex: Uint8Array.of(1, 2),
      isHexOnly: true
    });
    assert.deepStrictEqual(bytes(longTag.toBER(true)), [0x5f, 0x00, 0x00, 0x00, 0x00]);

    const bit = decodeBit([0x03, 0x02, 0x07, 0xa5]);
    assert.deepStrictEqual(bytes(bit.toBER(true)), [0x00, 0x00, 0x00, 0x00]);
  });

  it("falls back when ViewWriter methods are overridden", () => {
    const descriptor = Object.getOwnPropertyDescriptor(ViewWriter.prototype, "write");
    assert.ok(descriptor && "value" in descriptor);
    const original = descriptor.value as ViewWriter["write"];
    let calls = 0;
    Object.defineProperty(ViewWriter.prototype, "write", {
      ...descriptor,
      value: function (this: ViewWriter, buffer: ArrayBuffer | Uint8Array): void {
        calls += 1;
        Reflect.apply(original, this, [buffer]);
      }
    });
    try {
      const value = decode([0x04, 0x02, 0x01, 0x02]) as OctetString;
      assert.deepStrictEqual(bytes(value.toBER()), [0x04, 0x02, 0x01, 0x02]);
      assert.ok(calls > 0);
    } finally {
      Object.defineProperty(ViewWriter.prototype, "write", descriptor);
    }
  });
});
