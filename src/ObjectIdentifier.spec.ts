import * as assert from "assert";
import * as asn1js from "./index";
import { describe, it, expect } from "vitest";

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

// Expected DER values were independently checked with OpenSSL 3.6.3.
const oidVectors = [
  ["0.0", "060100"],
  ["0.39", "060127"],
  ["1.0", "060128"],
  ["1.39", "06014f"],
  ["2.0", "060150"],
  ["2.40", "060178"],
  ["2.47", "06017f"],
  ["2.48", "06028100"],
  ["2.9007199254740911", "06088fffffffffffff7f"],
  ["2.9007199254740912", "06089080808080808000"],
  ["2.9007199254740991", "0608908080808080804f"],
  ["2.9007199254740992", "06089080808080808050"],
  ["2.9007199254740993", "06089080808080808051"],
  ["1.2.9007199254740991", "06092a8fffffffffffff7f"],
  ["1.2.9007199254740992", "06092a9080808080808000"],
  ["1.2.9007199254740993", "06092a9080808080808001"],
  ["2.72057594037927936", "0609818080808080808050"],
  ["1.2.18446744073709551616", "060b2a82808080808080808000"],
  ["2.25.329800735698586629295641978511506172918", "06146983f09da7ebcfdee0c7a1a7b2c0948cc8f9d776"],
  ["2.9007199254740993.9007199254740993", "061090808080808080519080808080808001"],
];

function createExtension(oid: string): asn1js.Sequence {
  return new asn1js.Sequence({
    value: [new asn1js.ObjectIdentifier({ value: oid }), new asn1js.Boolean({ value: true }), new asn1js.OctetString({ valueHex: Uint8Array.of(1, 2, 3) })],
  });
}

describe("ObjectIdentifier exact decimal values", () => {
  it.each(oidVectors)("round-trips %s without losing precision", (value, expected) => {
    const oid = new asn1js.ObjectIdentifier({ value });
    expect(oid.getValue()).toBe(value);
    expect(oid.valueBlock.toString()).toBe(value);
    expect(oid.toString()).toBe(`OBJECT IDENTIFIER : ${value}`);
    expect(oid.toString("hex")).toBe(expected);
    expect(oid.toBER(true).byteLength).toBe(expected.length / 2);
    const json = oid.toJSON();
    expect(json.value).toBe(value);
    expect(json.valueBlock.value).toBe(value);
    expect(() => JSON.stringify(json)).not.toThrow();
    expect(oid.error).toBe("");

    const decoded = asn1js.fromBER(Buffer.from(expected, "hex"));
    expect(decoded.offset).toBe(expected.length / 2);
    expect(decoded.result).toBeInstanceOf(asn1js.ObjectIdentifier);
    const parsed = decoded.result as asn1js.ObjectIdentifier;
    expect(parsed.getValue()).toBe(value);
    expect(parsed.toString("hex")).toBe(expected);
    expect(new asn1js.ObjectIdentifier({ value: parsed.getValue() }).toString("hex")).toBe(expected);
    oid.setValue(value);
    expect(oid.getValue()).toBe(value);
    expect(oid.toString("hex")).toBe(expected);
  });

  it.each(["0", "1", "2", "3.1", "0.40", "1.40", "-1.2", "2.-1", "2.3garbage", "2.9007199254740993garbage"])("rejects the entire invalid OID %s", (value) => {
    const oid = new asn1js.ObjectIdentifier({ value });
    expect(oid.valueBlock.value).toEqual([]);
    expect(oid.getValue()).toBe("");
    expect(oid.error).not.toBe("");
    expect(oid.error).toBe(oid.valueBlock.error);
    expect(oid.toString("hex")).toBe("0600");
  });

  it("renders a long hex-only first SID using its actual value", () => {
    const parsed = asn1js.fromBER(Buffer.from("060980808080808080802a", "hex"));
    expect(parsed.offset).toBe(11);
    const oid = parsed.result as asn1js.ObjectIdentifier;
    expect(oid.valueBlock.value[0].isHexOnly).toBe(true);
    expect(oid.getValue()).toBe("1.2");
    expect(oid.toString("hex")).toBe("060980808080808080802a");
  });

  it("keeps a large first SID's storage and low-level string representation", () => {
    const oid = asn1js.fromBER(Buffer.from("0608fce08f9df08cc36f", "hex")).result as asn1js.ObjectIdentifier;
    expect(oid.getValue()).toBe("2.70228530105098655");
    expect(oid.valueBlock.value[0].toString()).toBe("7c600f1d700c436f");
    expect(typeof oid.toJSON().valueBlock.sidArray[0].valueDec).toBe("number");
  });

  it.each([8, 9, 10, 11, 12, 13, 14, 15])("renders %i base-128 digits across byte alignments", (length) => {
    const sid = Buffer.alloc(length, 0xff);
    sid[length - 1] = 0x7f;
    const ber = Buffer.concat([Buffer.from([6, length]), sid]);
    const oid = asn1js.fromBER(ber).result as asn1js.ObjectIdentifier;
    const value = `2.${(1n << BigInt(length * 7)) - 81n}`;
    expect(oid.getValue()).toBe(value);
    expect(new asn1js.ObjectIdentifier({ value }).toBER()).toEqual(ber.buffer.slice(ber.byteOffset, ber.byteOffset + ber.byteLength));
  });

  it("renders a long SID exactly in strings and JSON", () => {
    const length = 64 * 1024;
    const sid = Buffer.alloc(length, 0xff);
    sid[0] = 0x81;
    sid[length - 1] = 0x7f;
    const ber = Buffer.concat([Buffer.from([6, 0x83, 1, 0, 0]), sid]);
    const parsed = asn1js.fromBER(ber);
    expect(parsed.offset).toBe(ber.length);
    const oid = parsed.result as asn1js.ObjectIdentifier;
    const value = `2.${(1n << BigInt(7 * length - 6)) - 81n}`;
    expect(oid.getValue()).toBe(value);
    expect(oid.toString()).toBe(`OBJECT IDENTIFIER : ${value}`);
    const json = oid.toJSON();
    expect(json.value).toBe(value);
    expect(json.valueBlock.value).toBe(value);
    expect(Buffer.from(oid.toBER())).toEqual(ber);
  });

  it.each(["2.9007199254740993", "2.25.329800735698586629295641978511506172918"])("preserves %s through an Extension-style string conversion", (value) => {
    const original = createExtension(value).toBER();
    const decoded = asn1js.fromBER(original);
    expect(decoded.offset).toBe(original.byteLength);
    const sequence = decoded.result as asn1js.Sequence;
    // PKI.js and asn1-schema extract this string and later create another OID.
    const identifier = sequence.valueBlock.value[0].valueBlock.toString();
    expect(identifier).toBe(value);
    expect(createExtension(identifier).toBER()).toEqual(original);
  });
});

for (const [Block, sentinel] of [
  [asn1js.ObjectIdentifier, "0600"],
  [asn1js.RelativeObjectIdentifier, "0d00"],
] as const) {
  describe(`${Block.NAME} complete string validation`, () => {
    it.each([
      "",
      "wrong data",
      "1..2",
      "1.2.",
      "1.2.wrong.4",
      "1.2.3garbage",
      "1.2.9007199254740993garbage",
      "1.2.0x10",
      "1.2.0x20000000000001",
      "1.2.4e2",
      "1.2.1e100",
      "1.2.1e400",
      "1.2.-1",
      "1.2.+ 3",
      "1.2.1_000",
      "1.2.٣",
    ])("reports invalid input %j without throwing", (value) => {
      const oid = new Block({ value });
      expect(oid.getValue()).toBe("");
      expect(oid.valueBlock.value).toEqual([]);
      expect(oid.error).not.toBe("");
      expect(oid.error).toBe(oid.valueBlock.error);
      expect(oid.toString("hex")).toBe(sentinel);
      expect(oid.toBER(true).byteLength).toBe(2);
      expect(oid.toString()).toBe(`${Block.NAME} : empty`);
      expect(oid.toJSON().value).toBe("");
      expect(oid.toJSON().valueBlock.value).toBe("");
    });

    it.each([
      ["01.002.0003", "1.2.3"],
      [" +01. 002.003 ", "1.2.3"],
      ["1.2.-00", "1.2.0"],
      ["2. +9007199254740993 ", "2.9007199254740993"],
    ])("normalizes complete decimal input %j", (value, normalized) => {
      const oid = new Block({ value });
      expect(oid.getValue()).toBe(normalized);
      expect(oid.toString("hex")).toBe(new Block({ value: normalized }).toString("hex"));
      expect(oid.error).toBe("");
    });

    it("keeps omitted values available for schema declarations", () => {
      for (const oid of [new Block(), new Block({ value: undefined })]) {
        expect(oid.error).toBe("");
        expect(oid.valueBlock.error).toBe("");
        expect(oid.toString("hex")).toBe(sentinel);
        const ber = new Block({ value: "1.2.3" }).toBER();
        expect(asn1js.verifySchema(ber, oid).verified).toBe(true);
      }
    });

    it("clears invalid state and diagnostics on a subsequent valid setValue", () => {
      const oid = new Block({ value: "1.2.3" });
      oid.setValue("1.2.wrong.4");
      expect(oid.getValue()).toBe("");
      expect(oid.error).not.toBe("");
      expect(oid.toString("hex")).toBe(sentinel);
      oid.setValue("2.9007199254740993");
      expect(oid.getValue()).toBe("2.9007199254740993");
      expect(oid.error).toBe("");
      expect(oid.valueBlock.error).toBe("");
      oid.setValue("1.2.4");
      expect(oid.getValue()).toBe("1.2.4");
      expect(oid.valueBlock.value.every((sid) => !sid.isHexOnly)).toBe(true);
      expect(oid.error).toBe("");
    });

    it("reports encoding failures and recovers through setValue", () => {
      const oid = new Block({ value: "1.2.3" });
      oid.valueBlock.value[oid.valueBlock.value.length - 1].valueDec = -1;
      expect(oid.toString("hex")).toBe(sentinel);
      expect(oid.error).toBe("Error during encoding SID value");
      expect(oid.error).toBe(oid.valueBlock.error);
      oid.setValue("1.2.4");
      expect(oid.getValue()).toBe("1.2.4");
      expect(oid.toBER().byteLength).toBeGreaterThan(2);
      expect(oid.error).toBe("");
      expect(oid.valueBlock.error).toBe("");
    });

    it("retains independent identifier and length diagnostics", () => {
      const oid = new Block({ value: "1.2.3" });
      oid.idBlock.error = "identifier error";
      oid.lenBlock.error = "length error";
      oid.setValue("1.2.4");
      expect(oid.idBlock.error).toBe("identifier error");
      expect(oid.lenBlock.error).toBe("length error");
      expect(oid.error).toBe("identifier error");
    });

    it("keeps the invalid child sentinel in nested encoding and explicit writers", () => {
      const oid = new Block({ value: "1.2.wrong.4" });
      for (const isIndefiniteForm of [false, true]) {
        const sequence = new asn1js.Sequence({ lenBlock: { isIndefiniteForm }, value: [new asn1js.Integer({ value: 1 }), oid, new asn1js.Integer({ value: 2 })] });
        const expected = `${isIndefiniteForm ? "3080" : "3008"}020101${sentinel}020102${isIndefiniteForm ? "0000" : ""}`;
        expect(sequence.toString("hex")).toBe(expected);
        expect(sequence.toBER(true).byteLength).toBe(expected.length / 2);
        const writer = new asn1js.ViewWriter();
        expect(sequence.toBER(false, writer).byteLength).toBe(0);
        expect(Buffer.from(writer.final()).toString("hex")).toBe(expected);
        expect(sequence.error).toBe("");
        expect(oid.error).not.toBe("");
      }
    });

    it("retains permissive empty BER and truncated-SID errors", () => {
      const empty = asn1js.fromBER(Buffer.from(sentinel, "hex"));
      expect(empty.offset).toBe(2);
      expect(empty.result.error).toBe("");
      const truncated = asn1js.fromBER(Buffer.from(`${sentinel.slice(0, 2)}0180`, "hex"));
      expect(truncated.offset).toBe(-1);
      expect(truncated.result.error).toBe("End of input reached before message was fully decoded");
    });
  });
}
