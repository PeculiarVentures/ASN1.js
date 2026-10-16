import * as assert from "assert";
import * as asn1js from "./index";
import { describe, it } from "vitest";

describe("DATE", () => {
  it("to/from BER", () => {
    const testString = "2000-01-02";
    const asn = new asn1js.DATE({ value: testString });
    assert.strictEqual(asn.getValue(), testString);
    assert.strictEqual(asn.toString("hex"), "1f1f0a323030302d30312d3032");
    assert.strictEqual(asn.toString(), `DATE : '${testString}'`);
  });
});
