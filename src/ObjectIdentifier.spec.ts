import * as assert from "assert";
import * as asn1js from "./index";
import { describe, it } from "vitest";

describe("ObjectIdentifier", () => {
  describe("to/from BER", () => {
    it("starts with 0", () => {
      const value = "0.2.3.4.5";
      const asn = new asn1js.ObjectIdentifier({ value });

      assert.strictEqual(asn.toString("hex"), "060402030405");
      assert.strictEqual(asn.toString("ascii"), "OBJECT IDENTIFIER : 0.2.3.4.5");
    });
    it("starts with 1", () => {
      const value = "1.2.3.4.5";
      const asn = new asn1js.ObjectIdentifier({ value });

      assert.strictEqual(asn.toString("hex"), "06042a030405");
      assert.strictEqual(asn.toString("ascii"), "OBJECT IDENTIFIER : 1.2.3.4.5");
    });
    it("starts with 2", () => {
      const value = "2.2.3.4.5";
      const asn = new asn1js.ObjectIdentifier({ value });

      assert.strictEqual(asn.toString("hex"), "060452030405");
      assert.strictEqual(asn.toString("ascii"), "OBJECT IDENTIFIER : 2.2.3.4.5");
    });
    it("starts with incorrect value", () => {
      const value = "wrong data";
      const asn = new asn1js.ObjectIdentifier({ value });

      assert.strictEqual(asn.toString("hex"), "0600");
      assert.strictEqual(asn.toString("ascii"), "OBJECT IDENTIFIER : empty");
    });
  });
  it("to JSON", () => {
    const value = "1.2.3.4.5";
    const asn = new asn1js.ObjectIdentifier({ value });

    assert.strictEqual(asn.toJSON().value, "1.2.3.4.5");
  });
});
