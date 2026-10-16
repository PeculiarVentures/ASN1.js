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
});
