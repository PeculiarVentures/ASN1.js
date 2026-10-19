import * as assert from "assert";
import { int } from "@peculiar/utils";
import * as asn1js from "./index";
import { describe, it } from "vitest";

describe("Integer", () => {
  it("from number", () => {
    const asn = new asn1js.Integer({ value: 97196 });

    assert.strictEqual(asn.valueBlock.toString(), "97196");
    assert.strictEqual(asn.toString(), "INTEGER : 97196");
    assert.strictEqual(asn.toString("hex"), "0203017bac");

    const asn2 = asn1js.fromBER(asn.toBER());
    assert.ok(asn2.result instanceof asn1js.Integer);
    assert.strictEqual(asn2.result.valueBlock.valueDec, 97196);
  });

  it("from valueHex", () => {
    const asn = new asn1js.Integer({ valueHex: new Uint8Array([0x01, 0x7b, 0xac]) });

    assert.strictEqual(asn.valueBlock.isHexOnly, false);
    assert.strictEqual(asn.valueBlock.valueDec, 97196);
    assert.strictEqual(asn.valueBlock.toString(), "97196");
    assert.strictEqual(asn.toString(), "INTEGER : 97196");
    assert.strictEqual(asn.toString("hex"), "0203017bac");

    const asn2 = asn1js.fromBER(asn.toBER());
    assert.ok(asn2.result instanceof asn1js.Integer);
    assert.strictEqual(asn2.result.valueBlock.valueDec, 97196);
  });

  it("toString positive", () => {
    const asn = new asn1js.Integer({ valueHex: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]) });

    assert.strictEqual(asn.valueBlock.toString(), "18591708106338011145");
    assert.strictEqual(asn.toString(), "INTEGER : 18591708106338011145");
    assert.strictEqual(asn.toString("hex"), "0209010203040506070809");
  });

  it("toString negative", () => {
    const asn = new asn1js.Integer({ valueHex: new Uint8Array([0x81, 2, 3, 4, 5, 6, 7, 8]) });

    assert.strictEqual(asn.valueBlock.toString(), "-9150748177064392952");
    assert.strictEqual(asn.toString(), "INTEGER : -9150748177064392952");
    assert.strictEqual(asn.toString("hex"), "02088102030405060708");
  });

  describe("convert to/from BigInt", () => {
    it("positive", () => {
      const num = BigInt("18591708106338011145");
      const asn = asn1js.Integer.fromBigInt(num);
      assert.strictEqual(asn.toString("hex"), "0209010203040506070809");
      assert.strictEqual(asn.toBigInt(), num);
    });
    it("negative", () => {
      const num = BigInt("-9150748177064392952");
      const asn = asn1js.Integer.fromBigInt(num);
      assert.strictEqual(asn.toString("hex"), "02088102030405060708");
      assert.strictEqual(asn.toBigInt(), num);
    });
    it("keeps zero bytes after the sign byte of negative values", () => {
      assert.strictEqual(asn1js.Integer.fromBigInt(-32767).toString("hex"), "02028001");
      assert.strictEqual(asn1js.Integer.fromBigInt(-65535).toString("hex"), "0203ff0001");
    });
    it("encodes powers of two minimally", () => {
      assert.strictEqual(asn1js.Integer.fromBigInt(0).toString("hex"), "020100");
      assert.strictEqual(asn1js.Integer.fromBigInt(128).toString("hex"), "02020080");
      assert.strictEqual(asn1js.Integer.fromBigInt(-128).toString("hex"), "020180");
      assert.strictEqual(asn1js.Integer.fromBigInt(-129).toString("hex"), "0202ff7f");
      assert.strictEqual(asn1js.Integer.fromBigInt(-32768).toString("hex"), "02028000");
    });
    it("round-trips every 16-bit value", () => {
      for (let i = -65536; i <= 65536; i++) {
        const asn = asn1js.Integer.fromBigInt(i);
        assert.strictEqual(asn.toBigInt(), BigInt(i));
        assert.ok(int.isMinimal(asn.valueBlock.valueHexView), `${i} is not minimal`);
      }
    });
  });

  describe("convert to/from DER", () => {
    it("positive", () => {
      const asn = asn1js.Integer.fromBigInt("18591708106338011145");

      const der = asn.convertToDER();
      assert.strictEqual(der.toString("hex"), "0209010203040506070809");

      const fromDer = der.convertFromDER();
      assert.strictEqual(fromDer.toString("hex"), "0209010203040506070809");
    });
    it("negative", () => {
      const asn = asn1js.Integer.fromBigInt("-9150748177064392952");

      const der = asn.convertToDER();
      assert.strictEqual(der.toString("hex"), "0209008102030405060708");

      const fromDer = der.convertFromDER();
      assert.strictEqual(fromDer.toString("hex"), "02088102030405060708");
    });
  });
  describe("from numbers beyond the 32-bit range", () => {
    it("encodes integers up to and beyond 2^53", () => {
      assert.strictEqual(new asn1js.Integer({ value: 2 ** 53 }).toString("hex"), "020720000000000000");
      assert.strictEqual(new asn1js.Integer({ value: -(2 ** 53 - 1) }).toString("hex"), "0207e0000000000001");
    });
    it("throws on a fractional number", () => {
      assert.throws(() => new asn1js.Integer({ value: 1.5 }), RangeError);
    });
    it("keeps the previous value when the setter rejects a fractional number", () => {
      const asn = new asn1js.Integer({ value: 1 });
      assert.throws(() => {
        asn.valueBlock.valueDec = 1.5;
      }, /must be an integer/);
      assert.throws(() => {
        asn.valueBlock.valueDec = NaN;
      }, /must be an integer/);
      assert.strictEqual(asn.valueBlock.valueDec, 1);
      assert.strictEqual(asn.toString("hex"), "020101");
    });
  });
});
