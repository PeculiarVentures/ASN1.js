import * as assert from "assert";
import * as asn1js from "./index";
import { describe, it } from "vitest";

describe("DateTime", () => {
  it("to/from BER", () => {
    const testString = "2000-01-02 12:00";
    const asn = new asn1js.DateTime({ value: testString });
    assert.strictEqual(asn.getValue(), testString);
    assert.strictEqual(asn.toString("hex"), "1f2110323030302d30312d30322031323a3030");
    assert.strictEqual(asn.toString(), `DateTime : '${testString}'`);
  });
});
