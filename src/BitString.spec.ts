import * as assert from "assert";
import { hex } from "@peculiar/utils";
import * as asn1js from "./index";
import { describe, it } from "vitest";

describe("BitString", () => {
  it("parse zero-length", () => {
    const asn = asn1js.fromBER(hex.decode("0300"));
    assert.ok(asn.result instanceof asn1js.BitString);
  });
  it("parse empty", () => {
    const asn = asn1js.fromBER(hex.decode("030100"));
    assert.ok(asn.result instanceof asn1js.BitString);
  });
  it("incorrect unused bits", () => {
    const asn = asn1js.fromBER(hex.decode("030208ff"));
    assert.strictEqual(asn.offset, -1);
    assert.strictEqual(asn.result.error, "Unused bits for BitString must be in range 0-7");
  });
  it("incorrect unused bits in constructed BitString", () => {
    const asn = asn1js.fromBER(hex.decode("230403020800"));
    assert.strictEqual(asn.offset, -1);
    assert.strictEqual(asn.result.error, "Unused bits for BitString must be in range 0-7");
  });
  describe("toBER", () => {
    it("default", () => {
      const asn = new asn1js.BitString();
      assert.strictEqual(asn.toString("hex"), "030100");
    });

    it("primitive", () => {
      const asn = new asn1js.BitString({
        unusedBits: 1,
        valueHex: new Uint8Array([0x80]),
      });
      assert.strictEqual(asn.toString(), "BIT STRING : 1000000");
      assert.strictEqual(asn.toString("hex"), "03020180");
    });

    it("constructed", () => {
      const asn = new asn1js.BitString({
        value: [new asn1js.BitString({ valueHex: new Uint8Array([0x01]) }), new asn1js.BitString({ valueHex: new Uint8Array([0x02]) })],
      });
      assert.strictEqual(asn.toString("hex"), "23080302000103020002");
    });

    it("constructed indefinite form", () => {
      const asn = new asn1js.BitString({
        isIndefiniteForm: true,
        value: [new asn1js.BitString({ valueHex: new Uint8Array([0x01]) }), new asn1js.BitString({ valueHex: new Uint8Array([0x02]) })],
      });
      assert.strictEqual(asn.toString("hex"), "238003020001030200020000");
    });
  });
});
