import { describe, expect, it } from "vitest";
import { hex } from "@peculiar/utils";
import { fromBER, GeneralizedTime, IA5String, TeletexString } from "./index";
import type { DerViolationCode } from "./diagnostics";
import { createFromBerContext } from "./parser";
import { LocalObjectIdentifierValueBlock } from "./internals/LocalObjectIdentifierValueBlock";
import { LocalRelativeObjectIdentifierValueBlock } from "./internals/LocalRelativeObjectIdentifierValueBlock";

const bytes = (value: string): Uint8Array => new Uint8Array(hex.decode(value));
const time = (tag: number, value: string): Uint8Array => new Uint8Array([tag, value.length, ...Array.from(value, (character) => character.charCodeAt(0))]);
const nested = (input: Uint8Array): Uint8Array => new Uint8Array([0x30, input.length + 4, 0x30, input.length + 2, 0x30, input.length, ...input]);

interface InvalidValueCase {
  name: string;
  input: Uint8Array;
  code: DerViolationCode;
  berAccepts: boolean;
  berThrows?: boolean;
}

const invalidValues: InvalidValueCase[] = [
  { name: "empty INTEGER", input: bytes("0200"), code: "EMPTY_VALUE", berAccepts: true },
  { name: "empty ENUMERATED", input: bytes("0a00"), code: "EMPTY_VALUE", berAccepts: true },
  { name: "positive INTEGER with leading zero", input: bytes("02020001"), code: "NON_MINIMAL_INTEGER", berAccepts: true },
  { name: "negative INTEGER with leading FF", input: bytes("0202ff80"), code: "NON_MINIMAL_INTEGER", berAccepts: true },
  { name: "long nonminimal INTEGER", input: bytes("02050000000001"), code: "NON_MINIMAL_INTEGER", berAccepts: true },
  { name: "nonminimal ENUMERATED", input: bytes("0a020001"), code: "NON_MINIMAL_INTEGER", berAccepts: true },
  { name: "empty BOOLEAN", input: bytes("0100"), code: "INVALID_BOOLEAN", berAccepts: true },
  { name: "noncanonical true BOOLEAN", input: bytes("010101"), code: "INVALID_BOOLEAN", berAccepts: true },
  { name: "multiple BOOLEAN octets", input: bytes("01020000"), code: "INVALID_BOOLEAN", berAccepts: true },
  { name: "nonempty NULL", input: bytes("050100"), code: "INVALID_NULL", berAccepts: true },
  { name: "BIT STRING without unused-bits octet", input: bytes("0300"), code: "EMPTY_VALUE", berAccepts: true },
  { name: "BIT STRING unused bits without data", input: bytes("030107"), code: "BIT_STRING_UNUSED_BITS", berAccepts: true },
  { name: "BIT STRING unused bits above seven", input: bytes("03020800"), code: "BIT_STRING_UNUSED_BITS", berAccepts: false },
  { name: "BIT STRING nonzero padding", input: bytes("03020781"), code: "BIT_STRING_PADDING", berAccepts: true },
  { name: "empty OID", input: bytes("0600"), code: "EMPTY_VALUE", berAccepts: true },
  { name: "empty RELATIVE-OID", input: bytes("0d00"), code: "EMPTY_VALUE", berAccepts: true },
  { name: "nonminimal OID arc", input: bytes("06028001"), code: "INVALID_OID", berAccepts: true },
  { name: "nonminimal RELATIVE-OID arc", input: bytes("0d028001"), code: "INVALID_OID", berAccepts: true },
  { name: "unterminated OID arc", input: bytes("06022a81"), code: "INVALID_OID", berAccepts: false },
  { name: "unterminated RELATIVE-OID arc", input: bytes("0d0181"), code: "INVALID_OID", berAccepts: false },
  { name: "invalid UTF-8", input: bytes("0c01ff"), code: "INVALID_STRING", berAccepts: true },
  { name: "overlong UTF-8", input: bytes("0c02c080"), code: "INVALID_STRING", berAccepts: true },
  { name: "NumericString outside alphabet", input: bytes("120141"), code: "INVALID_STRING", berAccepts: true },
  { name: "PrintableString outside alphabet", input: bytes("130140"), code: "INVALID_STRING", berAccepts: true },
  { name: "IA5String non-ASCII octet", input: bytes("160180"), code: "INVALID_STRING", berAccepts: true },
  { name: "VisibleString control octet", input: bytes("1a0107"), code: "INVALID_STRING", berAccepts: true },
  { name: "BMPString odd length", input: bytes("1e0141"), code: "INVALID_STRING", berAccepts: false },
  { name: "BMPString surrogate", input: bytes("1e02d800"), code: "INVALID_STRING", berAccepts: true },
  { name: "UniversalString partial scalar", input: bytes("1c03000000"), code: "INVALID_STRING", berAccepts: false },
  { name: "UniversalString surrogate", input: bytes("1c040000d800"), code: "INVALID_STRING", berAccepts: true },
  { name: "UniversalString scalar above Unicode range", input: bytes("1c0400110000"), code: "INVALID_STRING", berAccepts: true },
  { name: "UTC lowercase zone", input: time(0x17, "000102121110z"), code: "INVALID_TIME", berAccepts: true },
  { name: "UTC omitted seconds", input: time(0x17, "0001021211Z"), code: "INVALID_TIME", berAccepts: true },
  { name: "UTC timezone offset", input: time(0x17, "000102121110+0000"), code: "INVALID_TIME", berAccepts: true },
  { name: "UTC leading garbage", input: time(0x17, "x000102121110Z"), code: "INVALID_TIME", berAccepts: true },
  { name: "UTC trailing garbage", input: time(0x17, "000102121110Zx"), code: "INVALID_TIME", berAccepts: true },
  { name: "UTC invalid calendar date", input: time(0x17, "000230121110Z"), code: "INVALID_TIME", berAccepts: true },
  { name: "GeneralizedTime trailing fractional zero", input: time(0x18, "20000102121110.50Z"), code: "INVALID_TIME", berAccepts: true },
  { name: "GeneralizedTime comma fraction", input: time(0x18, "20000102121110,5Z"), code: "INVALID_TIME", berAccepts: false, berThrows: true },
  { name: "GeneralizedTime empty fraction", input: time(0x18, "20000102121110.Z"), code: "INVALID_TIME", berAccepts: true },
  { name: "GeneralizedTime local time", input: time(0x18, "20000102121110"), code: "INVALID_TIME", berAccepts: true },
  { name: "GeneralizedTime omitted seconds", input: time(0x18, "200001021211Z"), code: "INVALID_TIME", berAccepts: true },
  { name: "GeneralizedTime invalid minute and second", input: time(0x18, "20000102180161Z"), code: "INVALID_TIME", berAccepts: true },
];

const validValues = [
  "020100",
  "020200ff",
  "0201ff",
  "0205008000000a",
  "0a0100",
  "010100",
  "0101ff",
  "0500",
  "030100",
  "03020780",
  "060100",
  "06022a00",
  "0d0100",
  "0c03616263",
  "0c04f09f9880",
  "120131",
  "130141",
  "16017f",
  "1a0120",
  "1e020041",
  "1c0400000041",
  "1c040001f600",
  "0400",
  "0403aabbcc",
  "1401ff",
  "1501ff",
  "1901ff",
  "1b01ff",
].map(bytes);
validValues.push(time(0x17, "000102121110Z"), time(0x18, "20000102121110Z"), time(0x18, "20000102121110.5Z"));

describe("DER primitive value parsing", () => {
  it.each(invalidValues)("rejects $name with a structured diagnostic", ({ input, code }) => {
    const parsed = fromBER(input, { encodingRules: "DER" });
    expect(parsed.offset).toBe(-1);
    expect(parsed.result.error).not.toBe("");
    expect(parsed.diagnostic).toMatchObject({ code, offset: 0, depth: 0 });
  });

  it.each(invalidValues)("locates $name at depth three", ({ input, code }) => {
    const parsed = fromBER(nested(input), { encodingRules: "DER" });
    expect(parsed.offset).toBe(-1);
    expect(parsed.diagnostic).toMatchObject({ code, offset: 6, depth: 3 });
  });

  it.each(invalidValues)("preserves BER behavior for $name with either completeness option", ({ input, berAccepts, berThrows }) => {
    for (const options of [{}, { requireFullInput: true }]) {
      if (berThrows) {
        expect(() => fromBER(input, options)).toThrow("Wrong input string for conversion");
        continue;
      }
      const parsed = fromBER(input, options);
      expect(parsed.offset).toBe(berAccepts ? input.length : -1);
      expect(parsed.diagnostic).toBeUndefined();
    }
  });

  it.each(validValues.map((input) => ({ name: hex.encode(input), input })))("accepts and round-trips $name in each parsing mode", ({ input }) => {
    for (const options of [{}, { requireFullInput: true }, { encodingRules: "DER" as const }]) {
      for (const encoded of [input, nested(input)]) {
        const parsed = fromBER(encoded, options);
        expect(parsed.offset).toBe(encoded.length);
        expect(parsed.result.error).toBe("");
        expect(parsed.diagnostic).toBeUndefined();
        expect(new Uint8Array(parsed.result.toBER())).toEqual(encoded);
      }
    }
  });

  it("locates the exact invalid value byte relative to a supplied subview", () => {
    const encoded = nested(bytes("03020781"));
    const backing = new Uint8Array([0xaa, 0xbb, ...encoded, 0xcc]);
    const parsed = fromBER(backing.subarray(2, -1), { encodingRules: "DER", copyInput: false });
    expect(parsed.diagnostic).toMatchObject({ code: "BIT_STRING_PADDING", offset: 6, byteOffset: 9, depth: 3 });
  });

  it.each([LocalObjectIdentifierValueBlock, LocalRelativeObjectIdentifierValueBlock])("checks OID content bounds before slicing ($NAME)", (Block) => {
    const block = new Block();
    const context = createFromBerContext({ encodingRules: "DER" });
    expect(block.fromBER(bytes("00"), 0, 2, context)).toBe(-1);
    expect(block.error).toBe("End of input reached before message was fully decoded (inconsistent offset and length values)");
    expect(context.diagnostic).toBeUndefined();
  });

  it("accepts and round-trips long canonical GeneralizedTime fractions", () => {
    const value = `20000102121110.${"1".repeat(200000)}Z`;
    const encoded = new Uint8Array(new GeneralizedTime({ value }).toBER());
    for (const options of [{}, { requireFullInput: true }, { encodingRules: "DER" as const }]) {
      const parsed = fromBER(encoded, options);
      expect(parsed.offset).toBe(encoded.length);
      expect(parsed.result.error).toBe("");
      expect(parsed.diagnostic).toBeUndefined();
      expect(new Uint8Array(parsed.result.toBER())).toEqual(encoded);
    }
  });

  it.each([
    { value: "20161231235960Z", date: "2017-01-01T00:00:00.000Z" },
    { value: "20150630235960.5Z", date: "2015-07-01T00:00:00.500Z" },
  ])("preserves $value when its Date conversion normalizes the leap second", ({ value, date }) => {
    const encoded = time(0x18, value);
    const parsed = fromBER(encoded, { encodingRules: "DER" });
    expect(parsed.offset).toBe(encoded.length);
    expect(parsed.result).toBeInstanceOf(GeneralizedTime);
    const generalized = parsed.result as GeneralizedTime;
    expect(generalized.toDate().toISOString()).toBe(date);
    expect(generalized.second).toBe(60);
    expect(generalized.toString()).toBe(value);
    expect(new Uint8Array(generalized.toBuffer())).toEqual(encoded.subarray(2));
    expect(new Uint8Array(generalized.toBER())).toEqual(encoded);
  });

  it("decodes long IA5String values without exceeding argument limits", () => {
    const value = "A".repeat(200000);
    const encoded = new Uint8Array(new IA5String({ value }).toBER());
    for (const options of [{}, { requireFullInput: true }, { encodingRules: "DER" as const }]) {
      const parsed = fromBER(encoded, options);
      expect(parsed.offset).toBe(encoded.length);
      expect(parsed.result.error).toBe("");
      expect((parsed.result as IA5String).getValue()).toBe(value);
      expect(new Uint8Array(parsed.result.toBER())).toEqual(encoded);
    }
  });

  it("preserves opaque TeletexString octets across decoding chunks", () => {
    const value = String.fromCharCode(...Array.from({ length: 128 }, (_, index) => index + 0x80)).repeat(2000);
    const encoded = new Uint8Array(new TeletexString({ value }).toBER());
    for (const options of [{}, { requireFullInput: true }, { encodingRules: "DER" as const }]) {
      const parsed = fromBER(encoded, options);
      expect(parsed.offset).toBe(encoded.length);
      expect(parsed.result.error).toBe("");
      expect((parsed.result as TeletexString).getValue()).toBe(value);
      expect(new Uint8Array(parsed.result.toBER())).toEqual(encoded);
    }
  });
});
