import * as assert from "assert";
import { describe, it } from "vitest";
import { Choice, compareSchema, fromBER, Integer, OctetString, Repeated, Sequence, verifySchema } from "./index";

describe("schema parsing compatibility", () => {
  it("keeps BER prefix parsing for primitiveSchema unless full consumption is requested", () => {
    const schema = new OctetString({ primitiveSchema: new Integer({ name: "integer" }) });
    const complete = fromBER(Uint8Array.of(0x04, 0x03, 0x02, 0x01, 0x01));
    assert.strictEqual(complete.offset, 5);
    const matched = compareSchema(complete.result, complete.result, schema);
    assert.strictEqual(matched.verified, true);
    if (matched.verified) {
      assert.ok(matched.result.integer instanceof Integer);
      assert.strictEqual(matched.result.integer.valueBlock.valueDec, 1);
    }

    const trailing = fromBER(Uint8Array.of(0x04, 0x05, 0x02, 0x01, 0x01, 0xde, 0xad));
    assert.strictEqual(trailing.offset, 7);
    assert.strictEqual(compareSchema(trailing.result, trailing.result, schema).verified, true);
    for (const options of [{}, { encodingRules: "BER" as const }, { requireFullInput: false }]) {
      assert.strictEqual(verifySchema(trailing.result.valueBeforeDecodeView, schema, options).verified, true);
    }
    for (const options of [{ requireFullInput: true }, { encodingRules: "DER" as const }]) {
      const rejected = verifySchema(trailing.result.valueBeforeDecodeView, schema, options);
      assert.strictEqual(rejected.verified, false);
      if (!rejected.verified) assert.strictEqual(rejected.diagnostic?.code, "TRAILING_DATA");
    }
  });

  it("borrows verifySchema input by default and copies only when copyInput is true", () => {
    const encoded = [0x30, 0x05, 0x04, 0x03, 0x02, 0x01, 0x01];
    for (const encodingRules of ["BER", "DER"] as const) {
      for (const copyInput of [undefined, true, false]) {
        for (const viewType of ["Uint8Array", "DataView"]) {
          const backing = Uint8Array.of(0xee, 0xff, ...encoded, 0xdd);
          const input = viewType === "DataView" ? new DataView(backing.buffer, 2, encoded.length) : backing.subarray(2, 2 + encoded.length);
          const schema = new Sequence({ value: [new OctetString({ name: "encodedInteger", primitiveSchema: new Integer({ name: "integer" }) })] });
          const checked = verifySchema(input, schema, { encodingRules, ...(copyInput === undefined ? {} : { copyInput }) });
          assert.strictEqual(checked.verified, true);
          if (!checked.verified) continue;
          assert.ok(checked.result instanceof Sequence);
          const outer = checked.result.encodedInteger;
          const inner = checked.result.integer;
          assert.ok(outer instanceof OctetString);
          assert.ok(inner instanceof Integer);
          assert.deepStrictEqual(Array.from(checked.result.valueBeforeDecodeView), encoded);
          assert.deepStrictEqual(Array.from(outer.valueBlock.valueHexView), [0x02, 0x01, 0x01]);
          assert.strictEqual(inner.valueBlock.valueDec, 1);

          backing[8] = 0x02;
          const visibleValue = copyInput === true ? 1 : 2;
          assert.deepStrictEqual(Array.from(checked.result.valueBeforeDecodeView), [...encoded.slice(0, -1), visibleValue]);
          assert.deepStrictEqual(Array.from(outer.valueBlock.valueHexView), [0x02, 0x01, visibleValue]);
          assert.deepStrictEqual(Array.from(inner.valueBlock.valueHexView), [visibleValue]);
          assert.strictEqual(inner.valueBlock.valueDec, 1);
          assert.strictEqual(checked.verified, true);
          assert.strictEqual(checked.result.valueBeforeDecodeView.buffer === backing.buffer, copyInput !== true);
          assert.strictEqual(inner.valueBlock.valueHexView.buffer === backing.buffer, copyInput !== true);
        }
      }
    }
  });

  it("tries Choice alternatives and skips optional fields after an embedded parse failure", () => {
    const opaque = Uint8Array.of(0x04, 0x01, 0x41);
    const sequence = Uint8Array.of(0x30, opaque.length, ...opaque);
    const schemas = [
      () => new Choice({ value: [new OctetString({ primitiveSchema: new Integer() }), new OctetString({ name: "opaque" })] }),
      () => new Sequence({ value: [new OctetString({ primitiveSchema: new Integer(), optional: true }), new OctetString({ name: "opaque" })] }),
      () => new Sequence({ value: [new Repeated({ value: new Choice({ value: [new OctetString({ primitiveSchema: new Integer() }), new OctetString({ name: "opaque" })] }) })] }),
    ];
    for (const [index, schema] of schemas.entries()) {
      const input = index === 0 ? opaque : sequence;
      const parsed = fromBER(input);
      assert.strictEqual(compareSchema(parsed.result, parsed.result, schema()).verified, true);
      for (const encodingRules of ["BER", "DER"] as const) {
        assert.strictEqual(verifySchema(input, schema(), { encodingRules }).verified, true);
      }
    }
  });

  it("keeps the independent embedded node budget for legacy BER schema comparisons", () => {
    const input = new Sequence({ value: Array.from({ length: 3334 }, () => new OctetString({ valueHex: Uint8Array.of(0x02, 0x01, 0x01) })) }).toBER();
    const schema = new Sequence({ value: [new Repeated({ value: new OctetString({ primitiveSchema: new Integer() }) })] });
    const decoded = fromBER(input);
    assert.strictEqual(decoded.offset, input.byteLength);
    assert.strictEqual(compareSchema(decoded.result, decoded.result, schema).verified, true);
    assert.strictEqual(verifySchema(input, schema).verified, true);
    const limited = verifySchema(input, schema, { maxNodes: 10000 });
    assert.strictEqual(limited.verified, false);
    if (!limited.verified) assert.match(limited.result.error, /node count exceeded/);
  });
});
