import * as assert from "assert";
import { describe, it } from "vitest";
import { Boolean, Choice, Integer, OctetString, Sequence, compareSchema, fromBER, verifySchema } from "./index";

const nonminimalInteger = Uint8Array.of(0x04, 0x04, 0x02, 0x02, 0x00, 0x01);
const trailingInteger = Uint8Array.of(0x04, 0x04, 0x02, 0x01, 0x01, 0xff);

function namedChoice(): Choice {
  return new Choice({ name: "choice", value: [new OctetString({ name: "alternative", primitiveSchema: new Integer() }), new Integer()] });
}

describe("Choice failure compatibility", () => {
  it("keeps the Choice failure envelope and name alongside an embedded DER diagnostic", () => {
    const checked = verifySchema(nonminimalInteger, namedChoice(), { encodingRules: "DER" });
    assert.strictEqual(checked.verified, false);
    if (checked.verified) return;
    assert.strictEqual(checked.name, "choice");
    assert.deepStrictEqual(checked.result, { error: "Wrong values for Choice type" });
    assert.strictEqual(checked.diagnostic?.code, "NON_MINIMAL_INTEGER");
    assert.strictEqual(checked.diagnostic?.offset, 2);
    assert.strictEqual(checked.diagnostic?.byteOffset, 4);
    assert.strictEqual(checked.diagnostic?.depth, 1);
  });

  it("preserves the same envelope for explicitly complete BER while default BER still accepts prefixes", () => {
    const checked = verifySchema(trailingInteger, namedChoice(), { requireFullInput: true });
    assert.strictEqual(checked.verified, false);
    if (checked.verified) return;
    assert.strictEqual(checked.name, "choice");
    assert.deepStrictEqual(checked.result, { error: "Wrong values for Choice type" });
    assert.strictEqual(checked.diagnostic?.code, "TRAILING_DATA");
    assert.strictEqual(checked.diagnostic?.offset, 5);
    assert.strictEqual(checked.diagnostic?.depth, 1);
    assert.strictEqual(verifySchema(trailingInteger, namedChoice()).verified, true);
    const decoded = fromBER(trailingInteger).result;
    assert.strictEqual(compareSchema(decoded, decoded, namedChoice()).verified, true);
  });

  it("retains the last available diagnostic without leaking an alternative's name", () => {
    const input = Uint8Array.of(0x04, 0x0d, 0x30, 0x0b, 0x04, 0x04, 0x02, 0x02, 0x00, 0x01, 0x04, 0x03, 0x01, 0x01, 0x01);
    const schema = new Choice({
      name: "choice",
      value: [
        new OctetString({ name: "first", primitiveSchema: new Sequence({ value: [new OctetString({ primitiveSchema: new Integer() }), new OctetString()] }) }),
        new OctetString({ name: "last", primitiveSchema: new Sequence({ value: [new OctetString(), new OctetString({ primitiveSchema: new Boolean() })] }) }),
        new Integer(),
      ],
    });
    const checked = verifySchema(input, schema, { encodingRules: "DER" });
    assert.strictEqual(checked.verified, false);
    if (checked.verified) return;
    assert.strictEqual(checked.name, "choice");
    assert.deepStrictEqual(checked.result, { error: "Wrong values for Choice type" });
    assert.strictEqual(checked.diagnostic?.code, "INVALID_BOOLEAN");
    assert.strictEqual(checked.diagnostic?.offset, 12);
    assert.strictEqual(checked.diagnostic?.byteOffset, 14);
    assert.strictEqual(checked.diagnostic?.depth, 3);
  });

  it("keeps the outer Choice name when nested choices fail", () => {
    const input = Uint8Array.of(0x30, nonminimalInteger.length, ...nonminimalInteger);
    const schema = new Choice({ name: "outer", value: [new Sequence({ value: [namedChoice()] }), new Integer()] });
    const checked = verifySchema(input, schema, { encodingRules: "DER" });
    assert.strictEqual(checked.verified, false);
    if (checked.verified) return;
    assert.strictEqual(checked.name, "outer");
    assert.deepStrictEqual(checked.result, { error: "Wrong values for Choice type" });
    assert.strictEqual(checked.diagnostic?.code, "NON_MINIMAL_INTEGER");
  });

  it("keeps ordinary BER and DER mismatches unchanged when no diagnostic is available", () => {
    for (const options of [{}, { encodingRules: "DER" as const }, { requireFullInput: true }]) {
      const checked = verifySchema(Uint8Array.of(0x02, 0x01, 0x01), new Choice({ name: "choice", value: [new OctetString(), new Boolean()] }), options);
      assert.deepStrictEqual(checked, { verified: false, name: "choice", result: { error: "Wrong values for Choice type" } });
    }
  });

  it("discards unsuccessful alternative diagnostics when a later alternative matches", () => {
    const schema = new Choice({ name: "choice", value: [new OctetString({ primitiveSchema: new Integer() }), new OctetString({ name: "opaque" })] });
    const checked = verifySchema(nonminimalInteger, schema, { encodingRules: "DER" });
    assert.strictEqual(checked.verified, true);
    assert.strictEqual("diagnostic" in checked, false);
    assert.strictEqual(checked.result.error, "");
    if (checked.verified) assert.ok(checked.result.opaque instanceof OctetString);
  });

  it("keeps legacy BER fallback after an independent embedded parse reaches its own limit", () => {
    let nested = new Sequence({ value: [new Integer({ value: 1 })] });
    for (let i = 0; i < 101; i++) nested = new Sequence({ value: [nested] });
    const input = new OctetString({ valueHex: nested.toBER() }).toBER();
    const required = new OctetString({ name: "required", primitiveSchema: new Sequence() });
    const schema = () => new Choice({ name: "choice", value: [required, new OctetString({ name: "opaque" })] });
    const failed = verifySchema(input, required, { parseEmbedded: false });
    assert.strictEqual(failed.verified, false);
    assert.match(failed.result.error, /Maximum ASN.1 nesting depth/);
    for (const options of [{}, { encodingRules: "BER" as const }, { requireFullInput: true }]) {
      const checked = verifySchema(input, schema(), { ...options, parseEmbedded: false });
      assert.strictEqual(checked.verified, true);
      if (checked.verified) assert.ok(checked.result.opaque instanceof OctetString);
      assert.strictEqual("diagnostic" in checked, false);
    }
    const decoded = fromBER(input, { parseEmbedded: false }).result;
    assert.strictEqual(compareSchema(decoded, decoded, schema()).verified, true);
    for (const options of [{ encodingRules: "DER" as const }, { encodingRules: "BER" as const, maxDepth: 100 }]) {
      const checked = verifySchema(input, schema(), { ...options, parseEmbedded: false });
      assert.strictEqual(checked.verified, false);
      assert.match(checked.result.error, /Maximum ASN.1 nesting depth/);
    }
  });

  it("returns resource exhaustion directly without trying an opaque fallback", () => {
    for (const encodingRules of ["BER", "DER"] as const) {
      const schema = new Choice({ name: "choice", value: [new OctetString({ name: "required", primitiveSchema: new Integer() }), new OctetString()] });
      const checked = verifySchema(Uint8Array.of(0x04, 0x03, 0x02, 0x01, 0x01), schema, { encodingRules, parseEmbedded: false, maxNodes: 1 });
      assert.strictEqual(checked.verified, false);
      if (checked.verified) continue;
      assert.strictEqual(checked.name, "required");
      assert.match(checked.result.error, /Maximum ASN.1 node count/);
      assert.strictEqual(checked.diagnostic, undefined);
    }
  });
});
