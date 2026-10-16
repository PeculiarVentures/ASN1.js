import * as assert from "assert";
import * as asn1js from "./index";
import { describe, it } from "vitest";

describe("Duration", () => {
  it("to/from BER", () => {
    const testString = "1000";
    const asn = new asn1js.Duration({ value: testString });
    assert.strictEqual(asn.getValue(), testString);
    assert.strictEqual(asn.toString("hex"), "1f220431303030");
    assert.strictEqual(asn.toString(), `Duration : '${testString}'`);
  });
});
