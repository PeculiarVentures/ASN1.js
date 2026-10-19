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
    it("round-trips a SID between 2^49 and 2^53", () => {
      const asn = new asn1js.ObjectIdentifier({ value: "1.2.1125899906842624" });

      assert.strictEqual(asn.toString("hex"), "06092a8280808080808000");
      assert.strictEqual(asn1js.fromBER(asn.toBER()).result.valueBlock.toString(), "1.2.1125899906842624");
    });
    it("keeps a SID above 2^53 as hex and re-encodes it unchanged", () => {
      const ber = "0608fce08f9df08cc36f";
      const asn = asn1js.fromBER(Buffer.from(ber, "hex")).result as asn1js.ObjectIdentifier;

      assert.deepStrictEqual(asn.valueBlock.value[0].warnings, ["Too big SID for decoding, hex only"]);
      assert.strictEqual(asn.toString("hex"), ber);
    });
  });
  it("to JSON", () => {
    const value = "1.2.3.4.5";
    const asn = new asn1js.ObjectIdentifier({ value });

    assert.strictEqual(asn.toJSON().value, "1.2.3.4.5");
  });
});
