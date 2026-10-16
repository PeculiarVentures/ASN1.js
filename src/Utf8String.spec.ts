import * as assert from "assert";
import { Convert } from "@peculiar/utils";
import * as asn1js from "./index";
import { describe, it } from "vitest";

describe("Utf8String", () => {
  it("to/from BER", () => {
    const testString = "My test текст";
    const testHex = "0c124d79207465737420d182d0b5d0bad181d182";

    const asn = new asn1js.Utf8String({ value: testString });
    assert.strictEqual(asn.getValue(), testString);
    assert.strictEqual(asn.toString("hex"), testHex);
    assert.strictEqual(asn.toString(), `UTF8String : '${testString}'`);

    const parsedAsn = asn1js.fromBER(Convert.FromHex(testHex));
    assert.ok(parsedAsn.result instanceof asn1js.Utf8String);
    assert.strictEqual(parsedAsn.result.getValue(), testString);
  });

  it("keeps raw bytes and warns on invalid UTF-8", () => {
    // "A" followed by an invalid byte and a truncated sequence
    const parsedAsn = asn1js.fromBER(Convert.FromHex("0c0341ffc3"));
    assert.ok(parsedAsn.result instanceof asn1js.Utf8String);
    const valueBlock = parsedAsn.result.valueBlock;
    assert.strictEqual(valueBlock.value, "A\xff\xc3");
    assert.strictEqual(Convert.ToHex(valueBlock.valueHexView), "41ffc3");
    assert.strictEqual(parsedAsn.result.warnings.length, 1);
  });

  it("keeps a leading BOM", () => {
    const parsedAsn = asn1js.fromBER(Convert.FromHex("0c04efbbbf41"));
    assert.ok(parsedAsn.result instanceof asn1js.Utf8String);
    assert.strictEqual(parsedAsn.result.getValue(), "\ufeffA");
    assert.strictEqual(parsedAsn.result.toString("hex"), "0c04efbbbf41");

    const asn = new asn1js.Utf8String({ value: "\ufeffA" });
    assert.strictEqual(asn.toString("hex"), "0c04efbbbf41");
  });

  it("throws on lone surrogates", () => {
    assert.throws(() => new asn1js.Utf8String({ value: "\ud800" }));
    assert.throws(() => new asn1js.Utf8String({ value: "A\udc00" }));
  });
});
