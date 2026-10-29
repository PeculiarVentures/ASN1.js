import { describe, expect, it } from "vitest";
import { runInNewContext } from "node:vm";
import * as asn1js from "./index";

type Oid = asn1js.ObjectIdentifier | asn1js.RelativeObjectIdentifier;

function replaceHexSid(oid: Oid, digits: number[], length = digits.length): void {
  const sid = oid.valueBlock.value[0];
  sid.isHexOnly = true;
  sid.valueHexView = Uint8Array.from(digits);
  sid.blockLength = length;
}

const mutations: [string, (oid: Oid) => void][] = [
  [
    "negative value",
    (oid) => {
      oid.valueBlock.value[0].valueDec = -1;
    },
  ],
  [
    "fractional value",
    (oid) => {
      oid.valueBlock.value[0].valueDec = 1.5;
    },
  ],
  [
    "unsafe number",
    (oid) => {
      oid.valueBlock.value[0].valueDec = Number.MAX_SAFE_INTEGER + 1;
    },
  ],
  [
    "NaN",
    (oid) => {
      oid.valueBlock.value[0].valueDec = NaN;
    },
  ],
  [
    "infinite value",
    (oid) => {
      oid.valueBlock.value[0].valueDec = Infinity;
    },
  ],
  [
    "empty SID list",
    (oid) => {
      oid.valueBlock.value.length = 0;
    },
  ],
  [
    "sparse SID list",
    (oid) => {
      oid.valueBlock.value.length += 1;
    },
  ],
  [
    "SID error",
    (oid) => {
      oid.valueBlock.value[0].error = "SID failed";
    },
  ],
  [
    "empty hex-only SID",
    (oid) => {
      replaceHexSid(oid, []);
    },
  ],
  [
    "short hex-only length",
    (oid) => {
      replaceHexSid(oid, [1, 2], 1);
    },
  ],
  [
    "long hex-only length",
    (oid) => {
      replaceHexSid(oid, [1, 2], 3);
    },
  ],
  [
    "invalid base-128 digit",
    (oid) => {
      replaceHexSid(oid, [0x80]);
    },
  ],
  [
    "non-minimal hex-only SID",
    (oid) => {
      replaceHexSid(oid, [0, 1]);
    },
  ],
];

for (const { Block, value, invalid, ber, sentinel } of [
  { Block: asn1js.ObjectIdentifier, value: "2.9007199254740993", invalid: "1.40", ber: "06089080808080808051", sentinel: "0600" },
  { Block: asn1js.RelativeObjectIdentifier, value: "9007199254740993", invalid: "1..2", ber: "0d089080808080808001", sentinel: "0d00" },
] as const) {
  describe(`${Block.NAME} strict mode`, () => {
    it("defaults to the legacy error policy", () => {
      const oid = new Block({ value: invalid });
      expect(oid.strict).toBe(false);
      expect(oid.toString("hex")).toBe(sentinel);
      const explicit = new Block({ value: invalid, strict: false });
      expect(explicit.toString("hex")).toBe(sentinel);
      expect(explicit.error).not.toBe("");
    });

    it.each(["", "wrong data", "1..2", "1.2.3garbage", "1.2.-1", "1.2.0x10", "1.2.1e100"])("throws on invalid constructor input %j", (input) => {
      expect(() => new Block({ value: input, strict: true })).toThrow(Error);
    });

    it("rejects invalid components in strict constructors", () => {
      expect(() => new Block({ value: invalid, strict: true })).toThrow(Error);
    });

    it("keeps exact values, JSON, and BER with strict enabled", () => {
      const oid = new Block({ value, strict: true });
      const legacy = new Block({ value });
      expect(oid.strict).toBe(true);
      expect(oid.getValue()).toBe(value);
      expect(oid.toJSON()).toEqual(legacy.toJSON());
      expect(JSON.stringify(oid.toJSON())).not.toContain('"strict"');
      expect(oid.toString("hex")).toBe(ber);
      expect(oid.toBER(true).byteLength).toBe(ber.length / 2);
      const writer = new asn1js.ViewWriter();
      expect(oid.toBER(false, writer).byteLength).toBe(0);
      expect(Buffer.from(writer.final()).toString("hex")).toBe(ber);
      expect(oid.error).toBe("");
    });

    it("uses the same decimal normalizations in both modes", () => {
      const oid = new Block({ value: " +01.002.-00 ", strict: true });
      expect(oid.getValue()).toBe("1.2.0");
      expect(oid.toString("hex")).toBe(new Block({ value: "1.2.0" }).toString("hex"));
    });

    it("invalidates a failed setValue and recovers through a successful assignment", () => {
      const oid = new Block({ value, strict: true });
      expect(() => oid.setValue(invalid)).toThrow(Error);
      expect(oid.getValue()).toBe("");
      expect(oid.valueBlock.value).toEqual([]);
      expect(oid.error).not.toBe("");
      expect(oid.error).toBe(oid.valueBlock.error);
      expect(() => oid.toBER()).toThrow(oid.error);
      expect(() => oid.toBER(true)).toThrow(oid.error);
      expect(() => oid.toString("hex")).toThrow(oid.error);
      expect(oid.toJSON().value).toBe("");

      oid.setValue(value);
      expect(oid.error).toBe("");
      expect(oid.valueBlock.error).toBe("");
      expect(oid.toString("hex")).toBe(ber);
    });

    it("does not treat manual SID replacement as recovery from a parse error", () => {
      const oid = new Block({ value, strict: true });
      const saved = oid.valueBlock.value;
      expect(() => oid.setValue(invalid)).toThrow(Error);
      oid.valueBlock.value = saved;
      expect(() => oid.toBER()).toThrow(Error);
      oid.setValue(value);
      expect(oid.toString("hex")).toBe(ber);
    });

    it("recovers from a failed strict encode after decoding a complete value", () => {
      const oid = new Block({ strict: true });
      expect(() => oid.toBER(true)).toThrow("OID value is empty");
      const content = Buffer.from(ber, "hex").subarray(2);
      oid.lenBlock.length = content.length;
      expect(oid.fromBER(content, 0, content.length)).toBe(content.length);
      expect(oid.getValue()).toBe(value);
      expect(oid.error).toBe("");
      expect(oid.valueBlock.error).toBe("");
      expect(oid.toString("hex")).toBe(ber);
    });

    it.each([false, true])("replaces decoded SID values and lengths on reuse (strict=%s)", (strict) => {
      const first = Buffer.from(new Block({ value: "1.2.3" }).toBER());
      const oid = asn1js.fromBER(first).result as Oid;
      oid.strict = strict;
      for (const [nextValue, encoded] of [
        [value, Buffer.from(ber, "hex")],
        ["1.2.3", first],
      ] as const) {
        const content = encoded.subarray(2);
        oid.lenBlock.length = content.length;
        oid.valueBlock.warnings.push("old value warning");
        expect(oid.fromBER(content, 0, content.length)).toBe(content.length);
        expect(oid.getValue()).toBe(nextValue);
        expect(oid.valueBlock.blockLength).toBe(content.length);
        expect(oid.blockLength).toBe(encoded.length);
        expect(oid.valueBlock.warnings).toEqual([]);
        expect(oid.error).toBe("");
        expect(Buffer.from(oid.toBER())).toEqual(encoded);
      }
    });

    it("discards failed BER prefixes and requires a complete decode for recovery", () => {
      const oid = new Block({ value, strict: true });
      const saved = oid.valueBlock.value;
      oid.lenBlock.length = 2;
      expect(oid.fromBER(Uint8Array.of(42, 0x80), 0, 2)).toBe(-1);
      expect(oid.getValue()).toBe("");
      expect(oid.valueBlock.blockLength).toBe(0);
      expect(oid.blockLength).toBe(0);
      const error = oid.error;
      expect(error).toBe("End of input reached before message was fully decoded");
      oid.valueBlock.value = saved;
      expect(() => oid.toBER()).toThrow(error);

      const content = Buffer.from(ber, "hex").subarray(2);
      oid.lenBlock.length = content.length;
      expect(oid.fromBER(content, 0, content.length)).toBe(content.length);
      expect(oid.getValue()).toBe(value);
      expect(oid.error).toBe("");
      expect(oid.toString("hex")).toBe(ber);
    });

    it("also replaces failed decoding state through the value block", () => {
      const oid = new Block({ value, strict: true });
      expect(oid.valueBlock.fromBER(Uint8Array.of(42, 0x80), 0, 2)).toBe(-1);
      expect(() => oid.toBER()).toThrow(Error);
      const content = Buffer.from(ber, "hex").subarray(2);
      expect(oid.valueBlock.fromBER(content, 0, content.length)).toBe(content.length);
      expect(oid.getValue()).toBe(value);
      expect(oid.toString("hex")).toBe(ber);
      expect(oid.error).toBe("");
      expect(oid.valueBlock.error).toBe("");
    });

    it("preserves independent header errors when value decoding recovers", () => {
      const oid = new Block({ strict: true });
      expect(() => oid.toBER()).toThrow(Error);
      oid.idBlock.error = "identifier error";
      oid.lenBlock.error = "length error";
      const content = Buffer.from(ber, "hex").subarray(2);
      oid.lenBlock.length = content.length;
      expect(oid.fromBER(content, 0, content.length)).toBe(content.length);
      expect(oid.valueBlock.error).toBe("");
      expect(oid.idBlock.error).toBe("identifier error");
      expect(oid.lenBlock.error).toBe("length error");
      expect(oid.error).toBe("identifier error");
    });

    it("enforces strict encoding in comparisons and hexadecimal output", () => {
      const oid = new Block({ value, strict: true });
      expect(oid.isEqual(new Block({ value }))).toBe(true);
      expect(oid.isEqual(new Block({ value: "1.2.3" }))).toBe(false);
      const empty = new Block({ strict: true });
      expect(empty.isEqual(empty)).toBe(true);
      expect(empty.isEqual({})).toBe(false);
      expect(() => empty.isEqual(oid)).toThrow("OID value is empty");
      expect(() => oid.isEqual(empty)).toThrow("OID value is empty");
      expect(() => empty.toString("hex")).toThrow("OID value is empty");
    });

    it("allows strict schema declarations without encoding empty placeholders", () => {
      for (const oid of [new Block({ strict: true }), new Block({ strict: true, value: undefined }), new Block({ strict: true, value: null as unknown as string })]) {
        expect(oid.error).toBe("");
        expect(asn1js.verifySchema(Buffer.from(ber, "hex"), oid).verified).toBe(true);
        expect(() => oid.toBER()).toThrow(Error);
        expect(oid.error).not.toBe("");
        expect(oid.error).toBe(oid.valueBlock.error);
        expect(() => oid.toBER(true)).toThrow(Error);
      }
    });

    it("can be enabled after permissive decoding without changing the value", () => {
      const parsed = asn1js.fromBER(Buffer.from(ber, "hex"));
      expect(parsed.offset).toBe(ber.length / 2);
      const oid = parsed.result as Oid;
      expect(oid.strict).toBe(false);
      expect(() => {
        oid.strict = true;
      }).not.toThrow();
      expect(oid.strict).toBe(true);
      expect(oid.valueBlock.strict).toBe(true);
      expect(oid.getValue()).toBe(value);
      expect(oid.toString("hex")).toBe(ber);
      const decodedAgain = asn1js.fromBER(oid.toBER()).result as Oid;
      expect(decodedAgain.strict).toBe(false);
    });

    it("delays checking when strict is enabled on an invalid object", () => {
      const oid = new Block({ value: invalid });
      const error = oid.error;
      expect(() => {
        oid.strict = true;
      }).not.toThrow();
      expect(oid.error).toBe(error);
      expect(() => oid.toBER()).toThrow(error);
      expect(oid.error).toBe(oid.valueBlock.error);
      oid.strict = false;
      expect(oid.toString("hex")).toBe(sentinel);
      oid.strict = true;
      expect(() => oid.toBER()).toThrow(Error);
      oid.setValue(value);
      expect(oid.toString("hex")).toBe(ber);
    });

    it("rejects empty values accepted by the permissive BER decoder", () => {
      const parsed = asn1js.fromBER(Buffer.from(sentinel, "hex"));
      expect(parsed.offset).toBe(2);
      const oid = parsed.result as Oid;
      expect(oid.error).toBe("");
      oid.strict = true;
      expect(() => oid.toBER()).toThrow(Error);
      expect(oid.error).not.toBe("");
      expect(oid.error).toBe(oid.valueBlock.error);
    });

    it("leaves BER decoding errors in the normal result channel", () => {
      const oid = new Block({ strict: true });
      expect(oid.valueBlock.fromBER(Uint8Array.of(0x80), 0, 1)).toBe(-1);
      expect(oid.valueBlock.error).toBe("End of input reached before message was fully decoded");
      expect(() => oid.toBER()).toThrow(oid.valueBlock.error);
      expect(oid.error).toBe(oid.valueBlock.error);
    });

    it.each(mutations)("rejects %s introduced through mutable SID state", (_name, mutate) => {
      for (const sizeOnly of [false, true]) {
        const oid = new Block({ value: "1.2.3", strict: true });
        mutate(oid);
        expect(() => oid.toBER(sizeOnly)).toThrow(Error);
        expect(oid.error).not.toBe("");
        expect(oid.error).toBe(oid.valueBlock.error);
        oid.setValue(value);
        expect(oid.toString("hex")).toBe(ber);
      }
    });

    it("allows valid hex-only digits even when valueDec is unused", () => {
      const oid = new Block({ value: "1.2.3", strict: true });
      replaceHexSid(oid, [1, 2]);
      oid.valueBlock.value[0].valueDec = NaN;
      expect(() => oid.toBER()).not.toThrow();
      expect(oid.error).toBe("");
    });

    it("accepts a valid Uint8Array from another realm", () => {
      const digits = runInNewContext("Uint8Array.of(42)") as Uint8Array;
      expect(digits instanceof Uint8Array).toBe(false);
      const oid = new Block({ value: "1.2.3", strict: true });
      const legacy = new Block({ value: "1.2.3" });
      for (const target of [oid, legacy]) {
        const sid = target.valueBlock.value[0];
        sid.isHexOnly = true;
        sid.valueHexView = digits;
        sid.blockLength = digits.length;
      }
      expect(oid.toBER()).toEqual(legacy.toBER());
      expect(oid.toBER(true).byteLength).toBe(legacy.toBER().byteLength);
      expect(oid.error).toBe("");
    });

    it("rejects other view types even with a spoofed Uint8Array tag", () => {
      for (const digits of [Int8Array.of(42), Uint8ClampedArray.of(42), Uint16Array.of(42), new DataView(new ArrayBuffer(1))]) {
        Object.defineProperty(digits, Symbol.toStringTag, { value: "Uint8Array" });
        const oid = new Block({ value: "1.2.3", strict: true });
        const sid = oid.valueBlock.value[0];
        sid.isHexOnly = true;
        sid.valueHexView = digits as unknown as Uint8Array;
        sid.blockLength = 1;
        expect(() => oid.toBER()).toThrow(Error);
        expect(oid.error).toBe(oid.valueBlock.error);
      }
    });

    it("checks numeric values instead of unused stored hex metadata", () => {
      const oid = new Block({ value: "1.2.3", strict: true });
      const expected = oid.toBER();
      oid.valueBlock.value[0].valueHexView = Uint8Array.of(0xff);
      oid.valueBlock.value[0].blockLength = NaN;
      expect(oid.toBER()).toEqual(expected);
    });

    it("validates later SIDs as well as the first one", () => {
      const oid = new Block({ value: "1.2.3", strict: true });
      oid.valueBlock.value[oid.valueBlock.value.length - 1].valueDec = -1;
      expect(() => oid.toBER()).toThrow(Error);
      expect(oid.error).toBe(oid.valueBlock.error);
    });

    it("allows switching strict off without clearing recorded errors", () => {
      const oid = new Block({ value, strict: true });
      expect(() => oid.setValue(invalid)).toThrow(Error);
      const error = oid.error;
      oid.strict = false;
      expect(oid.getValue()).toBe("");
      expect(oid.error).toBe(error);
      expect(oid.toString("hex")).toBe(sentinel);
      expect(oid.error).toBe(error);
    });

    it("aborts on SID serializer failure and keeps diagnostics accessible", () => {
      const oid = new Block({ value, strict: true });
      oid.valueBlock.value[0].toBER = () => new ArrayBuffer(0);
      expect(() => oid.toBER()).toThrow(Error);
      expect(oid.error).toBe("Error during encoding SID value");
      expect(oid.error).toBe(oid.valueBlock.error);
    });

    it("also enforces strict encoding on the value block", () => {
      const oid = new Block({ strict: true });
      expect(() => oid.valueBlock.toBER()).toThrow(Error);
      oid.setValue(value);
      expect(() => oid.valueBlock.fromString(invalid)).toThrow(Error);
      expect(oid.valueBlock.value).toEqual([]);
      expect(() => oid.valueBlock.toBER(true)).toThrow(Error);
    });

    it("supports implicit tags in strict mode", () => {
      const oid = new Block({ value, strict: true });
      const expected = Buffer.from(ber, "hex");
      expected[0] = 0x81;
      oid.idBlock.tagClass = 3;
      oid.idBlock.tagNumber = 1;
      expect(Buffer.from(oid.toBER())).toEqual(expected);
    });

    for (const Parent of [asn1js.Sequence, asn1js.Set, asn1js.Constructed]) {
      it.each([false, true])(`propagates nested errors through ${Parent.NAME} (indefinite=%s)`, (isIndefiniteForm) => {
        for (const sizeOnly of [false, true]) {
          const oid = new Block({ value, strict: true });
          expect(() => oid.setValue(invalid)).toThrow(Error);
          const inner = new asn1js.Sequence({ value: [oid] });
          const outer = new Parent({
            idBlock: { tagClass: 3, tagNumber: 0 },
            lenBlock: { isIndefiniteForm },
            value: [new asn1js.Integer({ value: 1 }), inner, new asn1js.Integer({ value: 2 })],
          });
          expect(() => outer.toBER(sizeOnly)).toThrow(Error);
          expect(oid.error).toBe(oid.valueBlock.error);
          const writer = new asn1js.ViewWriter();
          const prefix = Uint8Array.of(0xaa, 0xbb);
          writer.write(prefix);
          expect(() => outer.toBER(sizeOnly, writer)).toThrow(Error);
          // The caller must discard a writer after failure; earlier writes are retained.
          expect(Buffer.from(writer.final()).subarray(0, 2)).toEqual(Buffer.from(prefix));
          expect(writer.final().byteLength).toBeGreaterThan(prefix.length);
        }
      });
    }
  });
}

describe("ObjectIdentifier strict root validation", () => {
  it.each(["0", "1", "2", "3.1", "0.40", "1.40", "2.-1"])("rejects %s", (value) => {
    expect(() => new asn1js.ObjectIdentifier({ value, strict: true })).toThrow(Error);
  });

  it("does not apply absolute root restrictions to RelativeObjectIdentifier", () => {
    for (const value of ["0", "3.40", "12345.40", "9007199254740993"]) {
      const oid = new asn1js.RelativeObjectIdentifier({ value, strict: true });
      expect(oid.getValue()).toBe(value);
      expect(() => oid.toBER()).not.toThrow();
    }
  });

  for (const [Block, tag] of [
    [asn1js.ObjectIdentifier, "06"],
    [asn1js.RelativeObjectIdentifier, "0d"],
  ] as const) {
    it(`checks the active representation when encoding non-minimal ${Block.NAME} BER`, () => {
      const numeric = asn1js.fromBER(Buffer.from(`${tag}02802a`, "hex")).result as Oid;
      numeric.strict = true;
      expect(numeric.valueBlock.value[0].isHexOnly).toBe(false);
      expect(numeric.toString("hex")).toBe(`${tag}012a`);

      const hexOnly = asn1js.fromBER(Buffer.from(`${tag}0980808080808080802a`, "hex")).result as Oid;
      expect(hexOnly.strict).toBe(false);
      const value = hexOnly.getValue();
      hexOnly.strict = true;
      expect(() => hexOnly.toBER()).toThrow(Error);
      hexOnly.setValue(value);
      expect(hexOnly.toString("hex")).toBe(`${tag}012a`);
    });
  }
});
