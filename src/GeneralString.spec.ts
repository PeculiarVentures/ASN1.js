import * as assert from "assert";
import * as asn1js from "./index";
import { describe, it } from "vitest";

describe("GeneralString", () => {
  it("to/from BER", () => {
    const testString = "some text";
    const asn = new asn1js.GeneralString({ value: testString });
    assert.strictEqual(asn.getValue(), testString);
    assert.strictEqual(asn.toString("hex"), "1b09736f6d652074657874");
    assert.strictEqual(asn.toString(), `GeneralString : '${testString}'`);
  });
});
