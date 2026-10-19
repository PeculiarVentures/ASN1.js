import * as assert from "assert";
import { hex } from "@peculiar/utils";
import * as asn1js from "./index";
import { describe, it } from "vitest";

describe("UniversalString", () => {
  it("to/from BER", () => {
    const testString = "My test text";
    const testHex = "1c300000004d0000007900000020000000740000006500000073000000740000002000000074000000650000007800000074";

    const asn = new asn1js.UniversalString({ value: testString });
    assert.strictEqual(asn.getValue(), testString);
    assert.strictEqual(asn.toString("hex"), testHex);
    assert.strictEqual(asn.toString(), `UniversalString : '${testString}'`);

    const parsedAsn = asn1js.fromBER(hex.decode(testHex));
    assert.ok(parsedAsn.result instanceof asn1js.UniversalString);
    assert.strictEqual(parsedAsn.result.getValue(), testString);
  });

  it("encodes characters outside the BMP as one code point", () => {
    const asn = new asn1js.UniversalString({ value: "A\u{1F600}" });
    assert.strictEqual(asn.toString("hex"), "1c08000000410001f600");

    const parsedAsn = asn1js.fromBER(asn.toBER());
    assert.ok(parsedAsn.result instanceof asn1js.UniversalString);
    assert.strictEqual(parsedAsn.result.getValue(), "A\u{1F600}");
  });

  it("decodes surrogate pairs written by older versions", () => {
    const parsedAsn = asn1js.fromBER(hex.decode("1c080000d83d0000de00"));
    assert.ok(parsedAsn.result instanceof asn1js.UniversalString);
    assert.strictEqual(parsedAsn.result.getValue(), "\u{1F600}");
  });

  it("replaces code points beyond U+10FFFF and warns", () => {
    const parsedAsn = asn1js.fromBER(hex.decode("1c0400110000"));
    assert.ok(parsedAsn.result instanceof asn1js.UniversalString);
    assert.strictEqual(parsedAsn.result.getValue(), "\ufffd");
    assert.deepStrictEqual(parsedAsn.result.warnings, ["Code point 0x110000 is outside the Unicode range, using U+FFFD"]);
  });

  it("returns an error when the length is not a multiple of 4", () => {
    const parsedAsn = asn1js.fromBER(hex.decode("1c03000041"));
    assert.strictEqual(parsedAsn.offset, -1);
    assert.strictEqual(parsedAsn.result.error, "UniversalString value length must be a multiple of 4");
  });

  it("returns an error instead of truncating for indefinite content that is not a multiple of 4", () => {
    const parsedAsn = asn1js.fromBER(hex.decode("3c80000041"));
    assert.strictEqual(parsedAsn.offset, -1);
    assert.strictEqual(parsedAsn.result.error, "UniversalString value length must be a multiple of 4");
  });

  it("replaces lone surrogates and warns", () => {
    const parsedAsn = asn1js.fromBER(hex.decode("1c080000d80000000041"));
    assert.ok(parsedAsn.result instanceof asn1js.UniversalString);
    assert.strictEqual(parsedAsn.result.getValue(), "\ufffdA");
    assert.deepStrictEqual(parsedAsn.result.warnings, ["Code point 0xd800 is a lone surrogate, using U+FFFD"]);

    const trailing = asn1js.fromBER(hex.decode("1c040000dc00"));
    assert.strictEqual((trailing.result as asn1js.UniversalString).getValue(), "\ufffd");
  });

  it("decodes long values", () => {
    const value = "a\u{1F600}".repeat(10000);
    const parsedAsn = asn1js.fromBER(new asn1js.UniversalString({ value }).toBER());
    assert.strictEqual((parsedAsn.result as asn1js.UniversalString).getValue(), value);
  });
});
