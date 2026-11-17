import { describe, expect, it } from "vitest";
import { checkPrimitiveEncoding } from "./der";

const ascii = (value: string): Uint8Array => Uint8Array.from(value, (character) => character.charCodeAt(0));

describe("DER calendar diagnostics", () => {
  it.each([
    { suffix: "0000246061Z", field: "calendar month", fieldOffset: 0 },
    { suffix: "0230246061Z", field: "calendar day", fieldOffset: 2 },
    { suffix: "0228246061Z", field: "hour", fieldOffset: 4 },
    { suffix: "0228236061Z", field: "minute", fieldOffset: 6 },
    { suffix: "0228235961Z", field: "second", fieldOffset: 8 },
  ])("reports the first invalid $field with its original message and position", ({ suffix, field, fieldOffset }) => {
    for (const [tag, year] of [
      [23, "25"],
      [24, "2025"],
    ] as const) {
      expect(checkPrimitiveEncoding(tag, false, ascii(year + suffix))).toEqual({
        code: "INVALID_TIME",
        message: `Time contains an invalid ${field}`,
        contentOffset: year.length + fieldOffset,
      });
    }
  });

  it("permits a month-end leap second only for GeneralizedTime after validating the calendar", () => {
    expect(checkPrimitiveEncoding(23, false, ascii("000229235960Z"))).toEqual({
      code: "INVALID_TIME",
      message: "Time contains an invalid second",
      contentOffset: 10,
    });
    expect(checkPrimitiveEncoding(24, false, ascii("20000229235960Z"))).toBeUndefined();
    for (const value of ["19000229235960Z", "20000230235960Z"]) {
      expect(checkPrimitiveEncoding(24, false, ascii(value))).toEqual({
        code: "INVALID_TIME",
        message: "Time contains an invalid calendar day",
        contentOffset: 6,
      });
    }
    for (const value of ["20000228235960Z", "20000229235860Z", "20000229225960Z"]) {
      expect(checkPrimitiveEncoding(24, false, ascii(value))).toEqual({
        code: "INVALID_TIME",
        message: "Time contains an invalid second",
        contentOffset: 12,
      });
    }
  });
});
