import * as assert from "assert";
import { Convert } from "@peculiar/utils";
import * as asn1js from "./index";
import { describe, it } from "vitest";

describe("OctetString", () => {
  it("parse zero-length", () => {
    const asn = asn1js.fromBER(Convert.FromHex("0400"));
    assert.ok(asn.result instanceof asn1js.OctetString);
  });
  describe("to BER", () => {
    it("default", () => {
      const asn = new asn1js.OctetString();
      assert.strictEqual(asn.toString("hex"), "0400");
    });

    it("primitive", () => {
      const asn = new asn1js.OctetString({ valueHex: new Uint8Array([1, 2, 3, 4, 5]) });
      assert.strictEqual(asn.toString(), "OCTET STRING : 0102030405");
      assert.strictEqual(asn.toString("hex"), "04050102030405");
    });

    it("constructed", () => {
      const asn = new asn1js.OctetString({
        value: [new asn1js.OctetString({ valueHex: new Uint8Array([0x01]) }), new asn1js.OctetString({ valueHex: new Uint8Array([0x02]) })],
      });
      assert.strictEqual(asn.toString("hex"), "2406040101040102");
    });

    it("constructed indefinite form", () => {
      const asn = new asn1js.OctetString({
        isIndefiniteForm: true,
        value: [new asn1js.OctetString({ valueHex: new Uint8Array([0x01]) }), new asn1js.OctetString({ valueHex: new Uint8Array([0x02]) })],
      });
      assert.strictEqual(asn.toString("hex"), "24800401010401020000");
    });
  });
});
