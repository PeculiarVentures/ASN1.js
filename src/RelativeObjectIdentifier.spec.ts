import * as assert from "assert";
import * as asn1js from "./index";
import { describe, it } from "vitest";

describe("RelativeObjectIdentifier", () => {
  describe("to/from BER", () => {
    it("correct value", () => {
      const value = "12345.1234.123.12.1";
      const asn = new asn1js.RelativeObjectIdentifier({ value });

      assert.strictEqual(asn.toString("hex"), "0d07e03989527b0c01");
      assert.strictEqual(asn.toString("ascii"), `RelativeObjectIdentifier : ${value}`);

      const parsedAsn = asn1js.fromBER(asn.toBER());
      assert.ok(parsedAsn.result instanceof asn1js.RelativeObjectIdentifier);
      assert.strictEqual(parsedAsn.result.getValue(), asn.getValue());
    });
    it("incorrect value", () => {
      const value = "wrong data";
      const asn = new asn1js.RelativeObjectIdentifier({ value });

      assert.strictEqual(asn.toString("hex"), "0d00");
      assert.strictEqual(asn.toString("ascii"), "RelativeObjectIdentifier : empty");
    });
  });
  it("to JSON", () => {
    const value = "12345.2.3.4.5";
    const asn = new asn1js.RelativeObjectIdentifier({ value });

    assert.strictEqual(asn.toJSON().value, "12345.2.3.4.5");
  });
});
