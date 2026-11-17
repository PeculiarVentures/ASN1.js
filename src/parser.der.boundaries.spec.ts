import * as assert from "assert";
import { describe, it } from "vitest";
import { BitString, Constructed, Integer, OctetString, Sequence, fromBER, fromDER, verifySchema } from "./index";
import { LocalIdentificationBlock } from "./internals/LocalIdentificationBlock";

function bytes(hex: string): Uint8Array {
  return Uint8Array.from(hex.match(/../g) ?? [], (octet) => Number.parseInt(octet, 16));
}

function tlv(tag: number, content: Uint8Array): Uint8Array {
  return Uint8Array.of(tag, ...(content.length < 128 ? [content.length] : [0x81, content.length]), ...content);
}

const longChild = tlv(4, new Uint8Array(128).fill(0x55));
const malformed = [
  { name: "OCTET STRING child", input: bytes("300204020500") },
  { name: "INTEGER child", input: bytes("30030203010203") },
  { name: "SEQUENCE child", input: bytes("300230020500") },
  { name: "constructed context child", input: bytes("3002a0020500") },
  { name: "primitive context child", input: bytes("300280020500") },
  { name: "context parent", input: bytes("a00204020000") },
  { name: "nested child stealing a parent's sibling", input: bytes("3006300204020000") },
  { name: "long-tag child", input: bytes("30039f20020500") },
  { name: "canonical long-form child length", input: Uint8Array.of(0x30, 0x81, longChild.length - 1, ...longChild) },
];

function schemaFor(input: Uint8Array): Sequence | Constructed {
  return input[0] === 0xa0 ? new Constructed({ idBlock: { tagClass: 3, tagNumber: 0 } }) : new Sequence();
}

function summary(input: Uint8Array) {
  const decoded = fromDER(input);
  return { offset: decoded.offset, error: decoded.result.error, diagnostic: decoded.diagnostic };
}

describe("DER element boundaries", () => {
  it.each(malformed)("rejects a $name whose contents extend beyond its enclosing value", ({ input }) => {
    for (const decoded of [fromDER(input), fromBER(input, { encodingRules: "DER" })]) {
      assert.strictEqual(decoded.offset, -1);
      assert.notStrictEqual(decoded.result.error, "");
      assert.strictEqual(decoded.diagnostic, undefined);
    }
    const checked = verifySchema(input, schemaFor(input), { encodingRules: "DER" });
    assert.strictEqual(checked.verified, false);
    assert.notStrictEqual(checked.result.error, "");
  });

  it("rejects truncated roots and ignores backing-buffer bytes outside the exact input view", () => {
    const inputs = [bytes("040201"), bytes("020201"), bytes("30030201"), tlv(4, new Uint8Array(128)).subarray(0, -1), tlv(0x30, longChild).subarray(0, -1)];
    for (const input of inputs) {
      const backing = Uint8Array.of(0xee, ...input, 0x00, 0x00, 0xdd);
      for (const view of [backing.subarray(1, 1 + input.length), new DataView(backing.buffer, 1, input.length)]) {
        for (const copyInput of [true, false]) {
          const decoded = fromDER(view, { copyInput });
          assert.strictEqual(decoded.offset, -1);
          assert.notStrictEqual(decoded.result.error, "");
          assert.strictEqual(decoded.diagnostic, undefined);
        }
      }
    }
  });

  it("rejects parent overruns through exact-view parsing and schema verification with either copy option", () => {
    for (const input of [malformed[0].input, malformed[8].input]) {
      const backing = Uint8Array.of(0xee, 0xff, ...input, 0xdd);
      for (const view of [backing.subarray(2, 2 + input.length), new DataView(backing.buffer, 2, input.length)]) {
        for (const copyInput of [true, false]) {
          assert.strictEqual(fromDER(view, { copyInput }).offset, -1);
          assert.strictEqual(fromBER(view, { encodingRules: "DER", copyInput }).offset, -1);
          assert.strictEqual(verifySchema(view, new Sequence({ value: [new OctetString()] }), { encodingRules: "DER", copyInput }).verified, false);
        }
      }
    }
  });

  it("keeps the inherited permissive BER behavior, including explicit full-input parsing", () => {
    const cases = [
      { input: bytes("300204020500"), reencoded: bytes("300404020500"), schema: new Sequence({ value: [new OctetString()] }) },
      { input: bytes("30030203010203"), reencoded: bytes("30050203010203"), schema: new Sequence({ value: [new Integer()] }) },
      { input: bytes("a00204020000"), reencoded: bytes("a00404020000"), schema: new Constructed({ idBlock: { tagClass: 3, tagNumber: 0 }, value: [new OctetString()] }) },
      { input: bytes("3006300204020000"), reencoded: bytes("3006300404020000"), schema: new Sequence({ value: [new Sequence({ value: [new OctetString()] })] }) },
    ];
    for (const { input, reencoded, schema } of cases) {
      for (const options of [{}, { encodingRules: "BER" as const }, { requireFullInput: true }, { encodingRules: "BER" as const, requireFullInput: true }]) {
        const decoded = fromBER(input, options);
        assert.strictEqual(decoded.offset, input.length);
        assert.strictEqual(decoded.result.error, "");
        assert.strictEqual(decoded.diagnostic, undefined);
        assert.deepStrictEqual(new Uint8Array(decoded.result.toBER()), reencoded);
        assert.strictEqual(verifySchema(input, schema, options).verified, true);
      }
    }
  });

  it("keeps valid DER values within their boundaries, including canonical long lengths", () => {
    const inputs = [bytes("020101"), bytes("0500"), bytes("300404020500"), bytes("3006300204000500"), bytes("9f2001ff"), tlv(0x30, longChild), tlv(0xa0, longChild)];
    for (const input of inputs) {
      const backing = Uint8Array.of(0xee, ...input, 0xdd);
      for (const copyInput of [true, false]) {
        const decoded = fromDER(backing.subarray(1, 1 + input.length), { copyInput });
        assert.strictEqual(decoded.offset, input.length);
        assert.strictEqual(decoded.result.error, "");
        assert.strictEqual(decoded.diagnostic, undefined);
        assert.deepStrictEqual(new Uint8Array(decoded.result.toBER()), input);
        assert.strictEqual(decoded.result.valueBeforeDecodeView.buffer === backing.buffer, !copyInput);
      }
    }
  });

  it("enforces the same bounds when the fast parser falls back to generic header decoding", () => {
    const inputs = [...malformed.map(({ input }) => input), bytes("020101"), bytes("3003020101"), tlv(0x30, longChild)];
    const normal = inputs.map(summary);
    const descriptor = Object.getOwnPropertyDescriptor(LocalIdentificationBlock.prototype, "fromBER");
    assert.ok(descriptor && "value" in descriptor);
    const original = descriptor.value as LocalIdentificationBlock["fromBER"];
    let calls = 0;
    Object.defineProperty(LocalIdentificationBlock.prototype, "fromBER", {
      ...descriptor,
      value: function (this: LocalIdentificationBlock, ...args: Parameters<LocalIdentificationBlock["fromBER"]>) {
        calls += 1;
        return Reflect.apply(original, this, args);
      },
    });
    try {
      assert.deepStrictEqual(inputs.map(summary), normal);
      assert.ok(calls > 0);
    } finally {
      Object.defineProperty(LocalIdentificationBlock.prototype, "fromBER", descriptor);
    }
  });

  it("rejects overruns in mandatory embedded schemas while discarding failed optional heuristics", () => {
    const content = malformed[0].input;
    const innerSchema = new Sequence({ value: [new OctetString()] });
    const cases = [
      { input: tlv(4, content), schema: new OctetString({ primitiveSchema: innerSchema }) },
      { input: tlv(3, Uint8Array.of(0, ...content)), schema: new BitString({ primitiveSchema: innerSchema }) },
    ];
    for (const { input, schema } of cases) {
      for (const parseEmbedded of [false, true]) {
        const opaque = fromDER(input, { parseEmbedded });
        assert.strictEqual(opaque.offset, input.length);
        assert.strictEqual(opaque.result.error, "");
        assert.strictEqual(opaque.diagnostic, undefined);
        assert.ok(opaque.result instanceof OctetString || opaque.result instanceof BitString);
        assert.deepStrictEqual(opaque.result.valueBlock.value, []);
        assert.deepStrictEqual(new Uint8Array(opaque.result.toBER()), input);
        const checked = verifySchema(input, schema, { encodingRules: "DER", parseEmbedded });
        assert.strictEqual(checked.verified, false);
        assert.notStrictEqual(checked.result.error, "");
      }
    }
  });
});
