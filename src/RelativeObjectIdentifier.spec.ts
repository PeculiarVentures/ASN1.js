import * as assert from "assert";
import * as asn1js from "./index";
import { describe, it, expect } from "vitest";

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

describe("RelativeObjectIdentifier large decimal values", () => {
  // Content bytes checked independently with OpenSSL's OID encoder.
  it.each([
    ["0", "0d0100"],
    ["9007199254740991", "0d088fffffffffffff7f"],
    ["9007199254740992", "0d089080808080808000"],
    ["9007199254740993", "0d089080808080808001"],
    ["18446744073709551616", "0d0a82808080808080808000"],
    ["329800735698586629295641978511506172918", "0d1383f09da7ebcfdee0c7a1a7b2c0948cc8f9d776"],
    ["9007199254740993.9007199254740992", "0d1090808080808080019080808080808000"],
  ])("round-trips %s", (value, expected) => {
    const oid = new asn1js.RelativeObjectIdentifier({ value });
    const berBeforeRendering = oid.toBER();
    expect(oid.valueBlock.value.map((sid) => sid.toString()).join(".")).toBe(value);
    expect(oid.toBER()).toEqual(berBeforeRendering);
    expect(oid.getValue()).toBe(value);
    expect(oid.toString()).toBe(`RelativeObjectIdentifier : ${value}`);
    expect(oid.toString("hex")).toBe(expected);
    expect(oid.toBER(true).byteLength).toBe(expected.length / 2);
    expect(oid.toJSON().value).toBe(value);
    expect(oid.toJSON().valueBlock.value).toBe(value);
    expect(() => JSON.stringify(oid.toJSON())).not.toThrow();
    expect(oid.error).toBe("");
    const parsed = asn1js.fromBER(Buffer.from(expected, "hex"));
    expect(parsed.offset).toBe(expected.length / 2);
    const decoded = parsed.result as asn1js.RelativeObjectIdentifier;
    expect(decoded.valueBlock.value.map((sid) => sid.toString()).join(".")).toBe(value);
    expect(decoded).toBeInstanceOf(asn1js.RelativeObjectIdentifier);
    expect(decoded.getValue()).toBe(value);
    expect(decoded.toString("hex")).toBe(expected);
    expect(new asn1js.RelativeObjectIdentifier({ value: decoded.getValue() }).toString("hex")).toBe(expected);
    oid.setValue(value);
    expect(oid.toString("hex")).toBe(expected);
  });

  it("returns false from fromString on invalid input", () => {
    const oid = new asn1js.RelativeObjectIdentifier({ value: "1.2.3" });
    expect(oid.valueBlock.fromString("1..2")).toBe(false);
    expect(oid.valueBlock.value).toEqual([]);
    expect(oid.valueBlock.error).not.toBe("");
    expect(oid.valueBlock.fromString("9007199254740993")).toBe(true);
    expect(oid.valueBlock.error).toBe("");
    expect(oid.getValue()).toBe("9007199254740993");
  });
});
