import * as assert from "assert";
import { describe, it } from "vitest";
import { Integer, OctetString, Sequence, fromBER, verifySchema } from "./index";
import { createFromBerContext, localFromBER } from "./parser";

describe("requireFullInput parser option", () => {
  it("keeps BER prefix parsing by default and accepts exact input", () => {
    const input = Uint8Array.of(0x04, 0x01, 0x22, 0xde, 0xad, 0xbe, 0xef);
    for (const options of [{}, { requireFullInput: false }]) {
      const decoded = fromBER(input, options);
      assert.strictEqual(decoded.offset, 3);
      assert.strictEqual(decoded.result.error, "");
      assert.strictEqual(decoded.diagnostic, undefined);
    }

    const exact = fromBER(input.subarray(0, 3), { requireFullInput: true });
    assert.strictEqual(exact.offset, 3);
    assert.strictEqual(exact.diagnostic, undefined);
  });

  it("reports the first leftover byte at root depth and retains the decoded element", () => {
    const decoded = fromBER(Uint8Array.of(0x04, 0x01, 0x22, 0xde, 0xad, 0xbe, 0xef), { requireFullInput: true });
    assert.strictEqual(decoded.offset, -1);
    assert.ok(decoded.result instanceof OctetString);
    assert.ok(decoded.result.error);
    assert.deepStrictEqual(decoded.diagnostic, {
      code: "TRAILING_DATA",
      message: decoded.result.error,
      offset: 3,
      depth: 0,
    });
    assert.deepStrictEqual(Array.from(decoded.result.valueBeforeDecodeView), [0x04, 0x01, 0x22]);
  });

  it("accepts indefinite BER lengths and keeps full-input checks outside recursion", () => {
    const input = Uint8Array.of(0x30, 0x80, 0x02, 0x01, 0x01, 0x00, 0x00);
    const decoded = fromBER(input, { requireFullInput: true });
    assert.strictEqual(decoded.offset, input.length);
    assert.ok(decoded.result instanceof Sequence);

    const trailing = fromBER(Uint8Array.of(...input, 0xff), { requireFullInput: true });
    assert.strictEqual(trailing.diagnostic?.offset, input.length);

    const siblings = fromBER(Uint8Array.of(0x30, 0x06, 0x02, 0x01, 0x01, 0x02, 0x01, 0x02), { requireFullInput: true });
    assert.strictEqual(siblings.offset, 8);
    assert.strictEqual((siblings.result as Sequence).valueBlock.value.length, 2);

    const local = localFromBER(Uint8Array.of(0x02, 0x01, 0x01, 0xff), 0, 4, createFromBerContext({ requireFullInput: true }));
    assert.strictEqual(local.offset, 3);
    assert.strictEqual(local.diagnostic, undefined);
  });

  it("measures completeness against the supplied view with either input-copy option", () => {
    const backing = Uint8Array.of(0xee, 0x04, 0x01, 0x22, 0xff, 0xdd);
    const inputs = [backing.subarray(1, 5), new DataView(backing.buffer, 1, 4)];
    for (const input of inputs) {
      for (const copyInput of [true, false]) {
        const decoded = fromBER(input, { requireFullInput: true, copyInput });
        assert.strictEqual(decoded.offset, -1);
        assert.strictEqual(decoded.diagnostic?.offset, 3);
      }
    }
  });

  it("preserves decoder and resource failures without adding a diagnostic", () => {
    const cases = [
      fromBER(new ArrayBuffer(0), { requireFullInput: true }),
      fromBER(Uint8Array.of(0x02, 0x02, 0x01), { requireFullInput: true }),
      fromBER(Uint8Array.of(0x02, 0x01, 0x01), { requireFullInput: true, maxNodes: 0 }),
      fromBER(Uint8Array.of(0x02, 0x01, 0x01), { requireFullInput: true, maxContentLength: 0 }),
      fromBER(Uint8Array.of(0x30, 0x03, 0x02, 0x01, 0x01), { requireFullInput: true, maxDepth: 0 }),
    ];
    for (const decoded of cases) {
      assert.strictEqual(decoded.offset, -1);
      assert.ok(decoded.result.error);
      assert.strictEqual(decoded.diagnostic, undefined);
    }
  });

  it("applies the same options and diagnostics in verifySchema", () => {
    const input = Uint8Array.of(0x02, 0x01, 0x01, 0xff);
    assert.strictEqual(verifySchema(input, new Integer()).verified, true);

    const trailing = verifySchema(input, new Integer(), { requireFullInput: true });
    assert.strictEqual(trailing.verified, false);
    if (!trailing.verified) {
      assert.strictEqual(trailing.diagnostic?.code, "TRAILING_DATA");
      assert.strictEqual(trailing.diagnostic?.offset, 3);
      assert.strictEqual(trailing.diagnostic?.depth, 0);
    }

    assert.strictEqual(verifySchema(input.subarray(0, 3), new Integer(), { requireFullInput: true }).verified, true);
    const limited = verifySchema(input, new Integer(), { maxNodes: 0 });
    assert.strictEqual(limited.verified, false);
    if (!limited.verified) {
      assert.strictEqual(limited.result.error, "Maximum ASN.1 node count exceeded");
      assert.strictEqual(limited.diagnostic, undefined);
    }
  });
});
