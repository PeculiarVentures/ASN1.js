import * as assert from "assert";
import { describe, it } from "vitest";
import { compareSchema, fromBER, Integer, OctetString, Sequence, verifySchema } from "./index";

describe("schema parsing compatibility", () => {
  it("requires complete BER primitiveSchema content through compareSchema", () => {
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
    const rejected = compareSchema(trailing.result, trailing.result, schema);
    assert.strictEqual(rejected.verified, false);
    if (!rejected.verified) assert.strictEqual(rejected.diagnostic?.code, "TRAILING_DATA");
  });

  it("copies verifySchema input by default and shares only when copyInput is false", () => {
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
          const visibleValue = copyInput === false ? 2 : 1;
          assert.deepStrictEqual(Array.from(checked.result.valueBeforeDecodeView), [...encoded.slice(0, -1), visibleValue]);
          assert.deepStrictEqual(Array.from(outer.valueBlock.valueHexView), [0x02, 0x01, visibleValue]);
          assert.deepStrictEqual(Array.from(inner.valueBlock.valueHexView), [visibleValue]);
          assert.strictEqual(inner.valueBlock.valueDec, 1);
          assert.strictEqual(checked.verified, true);
          assert.strictEqual(checked.result.valueBeforeDecodeView.buffer === backing.buffer, copyInput === false);
          assert.strictEqual(inner.valueBlock.valueHexView.buffer === backing.buffer, copyInput === false);
        }
      }
    }
  });
});
