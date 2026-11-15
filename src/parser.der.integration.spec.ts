import * as assert from "assert";
import { readFileSync } from "node:fs";
import { rootCertificates } from "node:tls";
import { describe, it } from "vitest";
import { der, fromBER, fromDER, Integer, OctetString, Sequence, TeletexString, verifySchema, type AsnType, type EncodingRules, type FromBerOptions, type FromDerOptions } from "./index";

function bytes(value: string): Uint8Array {
  return Uint8Array.from(value.match(/../g) ?? [], (octet) => Number.parseInt(octet, 16));
}

function* blocks(block: AsnType): Generator<AsnType> {
  yield block;
  if (block.idBlock.isConstructed && "value" in block.valueBlock && Array.isArray(block.valueBlock.value)) {
    for (const child of block.valueBlock.value as AsnType[]) yield* blocks(child);
  }
}

function integerOctetSchema(): OctetString {
  return new OctetString({ primitiveSchema: new Integer() });
}

interface ExtendedFromBerOptions extends FromBerOptions {
  label?: string;
}

describe("public DER parsing", () => {
  it("accepts and preserves every root certificate bundled with the Node runtime", () => {
    assert.ok(rootCertificates.length > 0);
    for (const [index, pem] of rootCertificates.entries()) {
      const input = new Uint8Array(Buffer.from(pem.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\s/g, ""), "base64"));
      const parsed = fromDER(input);
      const label = `root certificate ${index}: ${parsed.diagnostic?.code ?? parsed.result.error}`;
      assert.strictEqual(parsed.offset, input.length, label);
      assert.strictEqual(parsed.result.error, "", label);
      assert.strictEqual(parsed.diagnostic, undefined, label);
      assert.deepStrictEqual(new Uint8Array(parsed.result.toBER()), input, label);
    }
  });

  it("accepts and preserves a signed certificate with legacy TeletexString names", () => {
    const input = new Uint8Array(readFileSync(new URL("./fixtures/strict-der/legacy-ca.der", import.meta.url)));
    assert.strictEqual(input.length, 1993);
    const parsed = fromDER(input);
    assert.strictEqual(parsed.offset, input.length);
    assert.strictEqual(parsed.result.error, "");
    assert.strictEqual(parsed.diagnostic, undefined);
    assert.ok(parsed.result instanceof Sequence);
    const names = [...blocks(parsed.result)].filter((block) => block instanceof TeletexString);
    assert.ok(names.length >= 2);
    assert.ok(names.some((name) => name.getValue() === "Legacy Téletex CA"));
    assert.deepStrictEqual(new Uint8Array(parsed.result.toBER()), input);
  });

  it("accepts and preserves a signed CRL containing 5000 revoked certificates", () => {
    const input = new Uint8Array(readFileSync(new URL("./fixtures/strict-der/revoked.crl.der", import.meta.url)));
    assert.strictEqual(input.length, 105558);
    const parsed = fromDER(input, { maxNodes: 100000 });
    assert.strictEqual(parsed.offset, input.length);
    assert.strictEqual(parsed.result.error, "");
    assert.strictEqual(parsed.diagnostic, undefined);
    assert.ok(parsed.result instanceof Sequence);
    assert.strictEqual([...blocks(parsed.result)].filter((block) => block instanceof Integer).length, 5001);
    assert.deepStrictEqual(new Uint8Array(parsed.result.toBER()), input);
  });

  it("uses the same strict rules and complete-input requirement through either public entry point", () => {
    for (const encoded of [bytes("02020001"), bytes("30800201010000"), bytes("040122ff")]) {
      const direct = fromDER(encoded);
      const options = fromBER(encoded, { encodingRules: "DER" });
      assert.strictEqual(direct.offset, -1);
      assert.deepStrictEqual(direct, options);
    }
    assert.strictEqual(fromBER(bytes("040122ff")).offset, 3);
    assert.strictEqual(fromDER(bytes("040122")).offset, 3);
    assert.throws(() => fromBER(bytes("040122"), { encodingRules: "DER", requireFullInput: false }), TypeError);
    // Even JavaScript callers passing fields outside FromDerOptions cannot weaken fromDER.
    const unsafeOptions = { encodingRules: "BER", requireFullInput: false } as unknown as FromDerOptions;
    assert.strictEqual(fromDER(bytes("02020001"), unsafeOptions).diagnostic?.code, "NON_MINIMAL_INTEGER");
    assert.strictEqual(fromDER(bytes("040122ff"), unsafeOptions).diagnostic?.code, "TRAILING_DATA");
  });

  it("reports positions relative to the exact supplied view with either copy option", () => {
    const backing = bytes("aabb300402020001ccdd");
    for (const input of [backing.subarray(2, 8), new DataView(backing.buffer, 2, 6)]) {
      for (const copyInput of [false, true]) {
        const parsed = fromDER(input, { copyInput });
        assert.strictEqual(parsed.offset, -1);
        assert.deepStrictEqual(
          { code: parsed.diagnostic?.code, offset: parsed.diagnostic?.offset, byteOffset: parsed.diagnostic?.byteOffset, depth: parsed.diagnostic?.depth },
          { code: "NON_MINIMAL_INTEGER", offset: 2, byteOffset: 4, depth: 1 },
        );
      }
    }
  });

  it("copies input by default and supports explicitly shared byte views", () => {
    const input = bytes("0402aabb");
    const copied = fromDER(input);
    const shared = fromDER(input, { copyInput: false });
    assert.strictEqual(copied.offset, input.length);
    assert.strictEqual(shared.offset, input.length);
    input[2] = 0xff;
    assert.deepStrictEqual(copied.result.valueBeforeDecodeView, bytes("0402aabb"));
    assert.deepStrictEqual(shared.result.valueBeforeDecodeView, bytes("0402ffbb"));
  });

  it("disables embedded-value detection by default and applies parser resource options", () => {
    const encoded = bytes("0403020101");
    const opaque = fromDER(encoded);
    const embedded = fromDER(encoded, { parseEmbedded: true });
    assert.ok(opaque.result instanceof OctetString);
    assert.ok(embedded.result instanceof OctetString);
    assert.strictEqual(opaque.result.valueBlock.value.length, 0);
    assert.strictEqual(embedded.result.valueBlock.value.length, 1);
    assert.ok(embedded.result.valueBlock.value[0] instanceof Integer);
    for (const options of [{ maxNodes: 0 }, { maxContentLength: 1 }]) {
      const parsed = fromDER(encoded, options);
      assert.strictEqual(parsed.offset, -1);
      assert.strictEqual(parsed.diagnostic, undefined);
    }
    assert.strictEqual(fromDER(bytes("3003020101"), { maxDepth: 0 }).offset, -1);
  });

  it("carries DER failures from mandatory primitiveSchema parsing through verifySchema", () => {
    assert.strictEqual(verifySchema(bytes("0403020101"), integerOctetSchema(), { encodingRules: "DER" }).verified, true);
    assert.strictEqual(verifySchema(bytes("040402020001"), integerOctetSchema()).verified, true);
    const invalid = verifySchema(bytes("040402020001"), integerOctetSchema(), { encodingRules: "DER" });
    assert.strictEqual(invalid.verified, false);
    if (!invalid.verified) {
      assert.strictEqual(invalid.diagnostic?.code, "NON_MINIMAL_INTEGER");
      assert.strictEqual(invalid.diagnostic?.offset, 2);
      assert.strictEqual(invalid.diagnostic?.depth, 1);
    }
    const incomplete = verifySchema(bytes("040402010100"), integerOctetSchema(), { encodingRules: "DER" });
    assert.strictEqual(incomplete.verified, false);
    if (!incomplete.verified) assert.strictEqual(incomplete.diagnostic?.code, "TRAILING_DATA");
  });

  it("exports the narrow DER helper surface and extensible parser option types", () => {
    assert.deepStrictEqual(Object.keys(der).sort(), ["checkPrimitiveEncoding", "checkSetOfOrder", "checkSetOrder", "compareSetOfElements"]);
    assert.strictEqual(der.checkPrimitiveEncoding(2, false, bytes("0001"))?.code, "NON_MINIMAL_INTEGER");
    assert.strictEqual(der.checkSetOrder([bytes("82"), bytes("81")])?.code, "SET_ORDER");
    assert.strictEqual(der.checkSetOfOrder([bytes("020102"), bytes("020101")])?.code, "SET_OF_ORDER");
    assert.ok(der.compareSetOfElements(bytes("020101"), bytes("020102")) < 0);
    const encodingRules: EncodingRules = "DER";
    const extensible: ExtendedFromBerOptions = { encodingRules, label: "caller metadata" };
    assert.strictEqual(fromBER(bytes("020101"), extensible).offset, 3);
    const narrowed: FromDerOptions = { copyInput: true };
    assert.strictEqual(fromDER(bytes("020101"), narrowed).offset, 3);
    const excludesMode: "encodingRules" extends keyof FromDerOptions ? false : true = true;
    const excludesCompleteness: "requireFullInput" extends keyof FromDerOptions ? false : true = true;
    assert.ok(excludesMode && excludesCompleteness);
  });
});
