import * as assert from "assert";
import { Convert } from "pvtsutils";
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

    const parsedAsn = asn1js.fromBER(Convert.FromHex(testHex));
    assert.ok(parsedAsn.result instanceof asn1js.UniversalString);
    assert.strictEqual(parsedAsn.result.getValue(), testString);
  });
});
