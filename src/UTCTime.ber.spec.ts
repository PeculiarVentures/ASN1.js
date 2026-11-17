import * as assert from "assert";
import { describe, expect, it } from "vitest";
import { fromBER, fromDER, Integer, Sequence, UTCTime } from "./index";

const ascii = (value: string): Uint8Array => Uint8Array.from(value, (character) => character.charCodeAt(0));
const encodedTime = (value: string): Uint8Array => new Uint8Array([0x17, value.length, ...ascii(value)]);
const sequence = (time: Uint8Array): Uint8Array => new Uint8Array([0x30, time.length + 6, 0x02, 0x01, 0x01, ...time, 0x02, 0x01, 0x02]);

const berTimes = [
  { value: "2501010000Z", utc: "2025-01-01T00:00:00.000Z" },
  { value: "8201020700-0500", utc: "1982-01-02T12:00:00.000Z" },
  { value: "010102070000-0500", utc: "2001-01-02T12:00:00.000Z" },
  { value: "2501010630+0630", utc: "2025-01-01T00:00:00.000Z" },
  { value: "250101063045+0630", utc: "2025-01-01T00:00:45.000Z" },
  { value: "2501010000-0545", utc: "2025-01-01T05:45:00.000Z" },
  { value: "250101000030-0545", utc: "2025-01-01T05:45:30.000Z" },
  { value: "2501010000+0000", utc: "2025-01-01T00:00:00.000Z" },
  { value: "250101000030-0000", utc: "2025-01-01T00:00:30.000Z" },
  { value: "2503010000+0030", utc: "2025-02-28T23:30:00.000Z" },
  { value: "240301000030+0030", utc: "2024-02-29T23:30:30.000Z" },
  { value: "0003010000+0030", utc: "2000-02-29T23:30:00.000Z" },
  { value: "2402292345-0030", utc: "2024-03-01T00:15:00.000Z" },
  { value: "9912312330-0100", utc: "2000-01-01T00:30:00.000Z" },
  { value: "0001010030+0100", utc: "1999-12-31T23:30:00.000Z" },
  { value: "000229120000+0000", utc: "2000-02-29T12:00:00.000Z" },
  { value: "500101000000+0100", utc: "1949-12-31T23:00:00.000Z" },
  { value: "491231233000-0100", utc: "2050-01-01T00:30:00.000Z" },
  { value: "5001010000+0001", utc: "1949-12-31T23:59:00.000Z" },
  { value: "491231235959-0001", utc: "2050-01-01T00:00:59.000Z" },
  { value: "2501020000+2359", utc: "2025-01-01T00:01:00.000Z" },
];

const invalidOffsetTimes = [
  "991340120000+0100",
  "2500010000+0000",
  "251301000000-0000",
  "250100120000+0100",
  "2501321200-0100",
  "250431120000+0100",
  "2502291200+0000",
  "010229120000-0100",
  "000230120000+0000",
  "2501012400+0000",
  "250101236000-0100",
  "250101235960+0100",
  "250101000099-0000",
];

function expectUtcTime(time: UTCTime, utc: string): void {
  const date = new Date(utc);
  expect(time.error).toBe("");
  expect(time.toDate().toISOString()).toBe(utc);
  expect([time.year, time.month, time.day, time.hour, time.minute, time.second]).toEqual([
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  ]);
}

describe("BER UTCTime", () => {
  it.each(berTimes)("decodes and preserves $value", ({ value, utc }) => {
    const input = encodedTime(value);
    for (const options of [{}, { requireFullInput: true }, { copyInput: false }]) {
      const parsed = fromBER(input, options);
      expect(parsed.offset).toBe(input.length);
      expect(parsed.diagnostic).toBeUndefined();
      assert.ok(parsed.result instanceof UTCTime);
      expectUtcTime(parsed.result, utc);
      expect(parsed.result.valueBlock.valueHexView).toEqual(ascii(value));
      expect(parsed.result.valueBeforeDecodeView).toEqual(input);
      expect(new Uint8Array(parsed.result.toBER())).toEqual(input);
    }
  });

  it.each(berTimes)("continues to the next SEQUENCE sibling after $value", ({ value, utc }) => {
    const time = encodedTime(value);
    const input = sequence(time);
    const parsed = fromBER(input, { requireFullInput: true });
    expect(parsed.offset).toBe(input.length);
    expect(parsed.result.error).toBe("");
    assert.ok(parsed.result instanceof Sequence);
    const [before, decoded, after] = parsed.result.valueBlock.value;
    assert.ok(before instanceof Integer);
    expect(before.valueBlock.valueDec).toBe(1);
    assert.ok(decoded instanceof UTCTime);
    expectUtcTime(decoded, utc);
    expect(decoded.valueBeforeDecodeView).toEqual(time);
    assert.ok(after instanceof Integer);
    expect(after.valueBlock.valueDec).toBe(2);
    expect(new Uint8Array(parsed.result.toBER())).toEqual(input);
  });

  it.each(berTimes)("supports constructing and converting $value", ({ value, utc }) => {
    const constructed = new UTCTime({ value });
    expectUtcTime(constructed, utc);
    expect(new Uint8Array(constructed.toBER())).toEqual(encodedTime(value));

    const converted = new UTCTime({ value: "250101000059Z" });
    converted.fromString(value);
    expectUtcTime(converted, utc);
    if (converted.year >= 1950 && converted.year <= 2049) {
      const canonical = utc.slice(2, 19).replace(/[-:T]/g, "") + "Z";
      expect(converted.toString()).toBe(canonical);
      expect(new Uint8Array(converted.toBuffer())).toEqual(ascii(canonical));
    } else {
      expect(() => converted.toBuffer()).toThrow(/between 1950 and 2049/);
    }
  });

  it.each(berTimes)("still rejects $value in DER at the correct position", ({ value }) => {
    const time = encodedTime(value);
    for (const [input, offset, depth] of [
      [time, 0, 0],
      [sequence(time), 5, 1],
    ] as const) {
      for (const parsed of [fromDER(input), fromBER(input, { encodingRules: "DER" })]) {
        expect(parsed.offset).toBe(-1);
        expect(parsed.result.error).not.toBe("");
        expect(parsed.diagnostic).toMatchObject({ code: "INVALID_TIME", offset, depth });
      }
    }
  });

  it("accepts canonical seconds with Z in both BER and DER", () => {
    const input = encodedTime("250101000030Z");
    for (const parsed of [fromBER(input), fromDER(input)]) {
      expect(parsed.offset).toBe(input.length);
      assert.ok(parsed.result instanceof UTCTime);
      expectUtcTime(parsed.result, "2025-01-01T00:00:30.000Z");
      expect(new Uint8Array(parsed.result.toBER())).toEqual(input);
    }
  });

  it("preserves the existing unanchored, lowercase, and calendar-range BER tolerance", () => {
    for (const value of ["x250101000030Z", "250101000030Zx", "250101000030z", "250230246199Z", "2502302461Z"]) {
      const input = encodedTime(value);
      const parsed = fromBER(input);
      expect(parsed.offset).toBe(input.length);
      assert.ok(parsed.result instanceof UTCTime);
      expect(parsed.result.error).toBe("");
      expect(new Uint8Array(parsed.result.toBER())).toEqual(input);
      expect(fromDER(input).diagnostic?.code).toBe("INVALID_TIME");
      if (value.startsWith("250230")) {
        expect([parsed.result.month, parsed.result.day, parsed.result.hour, parsed.result.minute, parsed.result.second]).toEqual([2, 30, 24, 61, value.endsWith("99Z") ? 99 : 0]);
      }
    }
  });

  it.each(["2501010000", "250101000000", "2501010000+01", "2501010000-010", "2501010000+2400", "250101000000-0060", "25010100000Z"])(
    "reports malformed time or zone in %s without throwing",
    (value) => {
      const time = new UTCTime({ value });
      expect(time.error).toBe("Wrong input string for conversion");
      const parsed = fromBER(encodedTime(value));
      expect(parsed.offset).toBe(encodedTime(value).length);
      expect(parsed.result.error).toBe("Wrong input string for conversion");
    },
  );

  it.each(invalidOffsetTimes)("reports invalid source fields in %s without normalizing them", (value) => {
    const input = encodedTime(value);
    const constructed = new UTCTime({ value });
    expect(constructed.error).toBe("Wrong input string for conversion");
    expect(constructed.year).toBe(0);
    expect(new Uint8Array(constructed.toBER())).toEqual(input);
    for (const options of [{}, { requireFullInput: true }, { copyInput: false }]) {
      const parsed = fromBER(input, options);
      expect(parsed.offset).toBe(input.length);
      expect(parsed.diagnostic).toBeUndefined();
      assert.ok(parsed.result instanceof UTCTime);
      expect(parsed.result.error).toBe("Wrong input string for conversion");
      expect(parsed.result.year).toBe(0);
      expect(parsed.result.valueBeforeDecodeView).toEqual(input);
      expect(new Uint8Array(parsed.result.toBER())).toEqual(input);
    }

    const nested = sequence(input);
    const parsed = fromBER(nested);
    expect(parsed.offset).toBe(nested.length);
    expect(parsed.result.error).toBe("");
    assert.ok(parsed.result instanceof Sequence);
    const [, decoded, after] = parsed.result.valueBlock.value;
    assert.ok(decoded instanceof UTCTime);
    expect(decoded.error).toBe("Wrong input string for conversion");
    assert.ok(after instanceof Integer);
    expect(after.valueBlock.valueDec).toBe(2);
    expect(new Uint8Array(parsed.result.toBER())).toEqual(nested);
    expect(fromDER(input).diagnostic?.code).toBe("INVALID_TIME");
  });

  it("keeps the existing BER calendar and clock tolerance for the corresponding Z forms", () => {
    for (const offsetValue of invalidOffsetTimes) {
      const value = offsetValue.replace(/[+-]\d{4}$/, "Z");
      const input = encodedTime(value);
      const parsed = fromBER(input);
      expect(parsed.offset).toBe(input.length);
      assert.ok(parsed.result instanceof UTCTime);
      expect(parsed.result.error).toBe("");
      expect(new Uint8Array(parsed.result.toBER())).toEqual(input);
      expect(parsed.result.month).toBe(parseInt(value.slice(2, 4), 10));
      expect(parsed.result.day).toBe(parseInt(value.slice(4, 6), 10));
      expect(parsed.result.hour).toBe(parseInt(value.slice(6, 8), 10));
      expect(parsed.result.minute).toBe(parseInt(value.slice(8, 10), 10));
    }
  });

  it("leaves previous fields intact on an invalid offset and clears the error after a valid replacement", () => {
    const time = new UTCTime({ value: "250101000000Z" });
    time.fromString("991340120000+0100");
    expect(time.error).toBe("Wrong input string for conversion");
    expect(time.toDate().toISOString()).toBe("2025-01-01T00:00:00.000Z");
    time.fromBuffer(ascii("250101235960+0000"));
    expect(time.error).toBe("Wrong input string for conversion");
    expect(time.toDate().toISOString()).toBe("2025-01-01T00:00:00.000Z");
    time.fromString("240229233045+0030");
    expectUtcTime(time, "2024-02-29T23:00:45.000Z");
  });

  it("clears conversion errors when a reused instance receives a valid value", () => {
    const time = new UTCTime({ value: "invalid" });
    expect(time.error).not.toBe("");
    time.fromString("2501010000Z");
    expectUtcTime(time, "2025-01-01T00:00:00.000Z");

    time.fromString("invalid");
    time.fromBuffer(ascii("2501010100+0100"));
    expectUtcTime(time, "2025-01-01T00:00:00.000Z");

    time.lenBlock.length = 1;
    expect(time.fromBER(ascii("x"), 0, 1)).toBe(1);
    const value = ascii("2501010000Z");
    time.lenBlock.length = value.length;
    expect(time.fromBER(value, 0, value.length)).toBe(value.length);
    expectUtcTime(time, "2025-01-01T00:00:00.000Z");
  });
});
