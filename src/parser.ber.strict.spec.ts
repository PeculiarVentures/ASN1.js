import * as assert from "assert";
import { describe, it } from "vitest";
import { EndOfContent, Integer, ObjectIdentifier, OctetString, RelativeObjectIdentifier, Sequence, UniversalString, fromBER, verifySchema } from "./index";

function bytes(hex: string): Uint8Array {
  return Uint8Array.from(hex.match(/../g) ?? [], (octet) => Number.parseInt(octet, 16));
}

describe("BER end-of-contents and indefinite-length validation", () => {
  it("rejects non-zero and indefinite-length [UNIVERSAL 0] encodings in all BER modes", () => {
    const malformed = [
      bytes("000100"),
      bytes("00020000"),
      bytes("200100"),
      bytes("20800000"),
      bytes("30800201010001"),
      bytes("30800201010001aa"),
      bytes("308002010120800000"),
      bytes("24800401aa0001"),
      bytes("2380030200aa0001"),
    ];
    for (const input of malformed) {
      for (const options of [{}, { requireFullInput: true }, { strictBer: true, requireFullInput: true }]) {
        const decoded = fromBER(input, options);
        assert.strictEqual(decoded.offset, -1);
        assert.notStrictEqual(decoded.result.error, "");
      }
    }

    const direct = new EndOfContent({ lenBlock: { length: 1 } });
    assert.strictEqual(direct.fromBER(Uint8Array.of(0x00), 0, 1), -1);
    assert.strictEqual(direct.error, "Non-zero length of value block for EndOfContent type");
  });

  it("rejects non-canonical [UNIVERSAL 0] terminators on indefinite-length containers", () => {
    const malformed = [
      bytes("30800201012000"),
      bytes("3080020101008100"),
      bytes("30800201011f0000"),
      bytes("24800401aa2000"),
      bytes("24800401aa008100"),
      bytes("24800401aa1f0000"),
      bytes("2380030200aa2000"),
    ];
    for (const input of malformed) {
      for (const options of [{}, { requireFullInput: true }]) {
        const decoded = fromBER(input, options);
        assert.strictEqual(decoded.offset, -1);
        assert.strictEqual(decoded.result.error, "Type [UNIVERSAL 0] is reserved");
      }
    }
  });

  it("rejects indefinite-length containers missing EndOfContent at end of input", () => {
    const truncated = [bytes("3080"), bytes("2480"), bytes("2380"), bytes("30023080"), bytes("30022480"), bytes("30022380"), bytes("3080020101"), bytes("24800401aa"), bytes("2380030200aa")];
    for (const input of truncated) {
      for (const options of [{}, { requireFullInput: true }, { strictBer: true, requireFullInput: true }]) {
        const decoded = fromBER(input, options);
        assert.strictEqual(decoded.offset, -1);
        assert.notStrictEqual(decoded.result.error, "");
      }
    }
  });

  it("accepts empty and nested indefinite-length containers closed by canonical 00 00", () => {
    const valid = [bytes("30800000"), bytes("24800000"), bytes("23800000"), bytes("308024800402686904012100000000")];
    for (const input of valid) {
      for (const options of [{ requireFullInput: true }, { strictBer: true, requireFullInput: true }]) {
        const decoded = fromBER(input, options);
        assert.strictEqual(decoded.offset, input.length);
        assert.strictEqual(decoded.result.error, "");
      }
    }
  });
});

describe("strictBer structural validation", () => {
  it("enforces parent container boundaries while keeping valid indefinite BER", () => {
    const overruns = [bytes("300204020500"), bytes("30030203010203"), bytes("a00204020000"), bytes("3006300204020000"), bytes("30803002040200000000")];
    for (const input of overruns) {
      const decoded = fromBER(input, { strictBer: true, requireFullInput: true });
      assert.strictEqual(decoded.offset, -1);
      assert.strictEqual(decoded.result.error, "End of input reached before message was fully decoded (inconsistent content length)");
    }

    const schema = new Sequence({ value: [new OctetString()] });
    assert.strictEqual(verifySchema(bytes("300204020500"), schema, { strictBer: true, requireFullInput: true }).verified, false);
    assert.strictEqual(verifySchema(bytes("3080040205000000"), schema, { strictBer: true, requireFullInput: true }).verified, true);
  });

  it("rejects unexpected EndOfContent at root, inside definite containers, and across embedded parses", () => {
    const unexpectedEoc = [bytes("0000"), bytes("2000"), bytes("008100"), bytes("1f0000"), bytes("30020000"), bytes("3080300200000000")];
    for (const input of unexpectedEoc) {
      const decoded = fromBER(input, { strictBer: true, requireFullInput: true });
      assert.strictEqual(decoded.offset, -1);
      assert.strictEqual(decoded.result.error, "Type [UNIVERSAL 0] is reserved");
    }

    // Embedded primitiveSchema inside an outer indefinite container must not inherit allowEoc
    const embeddedEoc = bytes("3080040200000000");
    const embeddedSchema = new Sequence({ value: [new OctetString({ primitiveSchema: new Integer() })] });
    assert.strictEqual(verifySchema(embeddedEoc, embeddedSchema, { strictBer: true, requireFullInput: true }).verified, false);
  });

  it("rejects primitive SEQUENCE and SET forms under strictBer", () => {
    for (const input of [bytes("1000"), bytes("1100"), bytes("308010000000")]) {
      const decoded = fromBER(input, { strictBer: true, requireFullInput: true });
      assert.strictEqual(decoded.offset, -1);
      assert.strictEqual(decoded.result.error, "Primitive encoding used for constructed type");
    }
  });
});

describe("nested constructed OctetString and identifier resource bounds", () => {
  it("recursively concatenates multi-level constructed OctetString chunks in getValue()", () => {
    // 24 80 [ 04 02 "ab", 24 80 [ 04 02 "cd", 24 03 [ 04 01 "e" ] ] 00 00, 04 01 "f" ] 00 00
    const input = bytes("248004026162248004026364240304016500000401660000");
    const decoded = fromBER(input, { strictBer: true, requireFullInput: true, parseEmbedded: false });
    assert.strictEqual(decoded.offset, input.length);
    assert.ok(decoded.result instanceof OctetString);
    assert.deepStrictEqual(new Uint8Array(decoded.result.getValue()), Uint8Array.from([0x61, 0x62, 0x63, 0x64, 0x65, 0x66]));
  });

  it("charges maxNodes for oversized OBJECT IDENTIFIER and RELATIVE-OID component counts", () => {
    const payload = new Uint8Array(200).fill(0x01);
    for (const [tag, Type] of [
      [0x06, ObjectIdentifier],
      [0x0d, RelativeObjectIdentifier],
    ] as const) {
      const encoded = Uint8Array.of(tag, 0x81, payload.length, ...payload);
      const limited = fromBER(encoded, { maxNodes: 5 });
      assert.strictEqual(limited.offset, -1);
      assert.strictEqual(limited.result.error, "Maximum ASN.1 node count exceeded");
      assert.ok(limited.result instanceof Type);
      assert.strictEqual(limited.result.valueBlock.value.length, 0);

      const allowed = fromBER(encoded, { maxNodes: 20 });
      assert.strictEqual(allowed.offset, encoded.length);
      assert.strictEqual(allowed.result.error, "");
    }
  });

  it("bounds retained UniversalString warning arrays on repeated invalid code points", () => {
    const body = new Uint8Array(800);
    for (let i = 0; i < body.length; i += 4) {
      body[i] = 0x00;
      body[i + 1] = 0x11;
    }
    const encoded = Uint8Array.of(0x1c, 0x82, body.length >> 8, body.length & 0xff, ...body);
    const decoded = fromBER(encoded);
    assert.strictEqual(decoded.offset, encoded.length);
    assert.ok(decoded.result instanceof UniversalString);
    assert.strictEqual(decoded.result.warnings.length, 100);
  });
});
