import * as assert from "assert";
import * as asn1js from "./index";
import { describe, it } from "vitest";

describe("NumericString", () => {
  it("to/from BER", () => {
    const testString = "1234567890";
    const asn = new asn1js.NumericString({ value: testString });
    assert.strictEqual(asn.getValue(), testString);
    assert.strictEqual(asn.toString("hex"), "120a31323334353637383930");
    assert.strictEqual(asn.toString(), `NumericString : '${testString}'`);
  });
});
