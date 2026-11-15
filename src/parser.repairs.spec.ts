import { describe, expect, it } from "vitest";
import { fromBER, GeneralizedTime, ObjectIdentifier, RelativeObjectIdentifier, UTCTime, VisibleString } from "./index";

const timeBytes = (tag: number, value: string): Uint8Array => new Uint8Array([tag, value.length, ...Array.from(value, (character) => character.charCodeAt(0))]);

describe("BER time decoder errors", () => {
  it("fails when UTCTime decoding sets an error", () => {
    const input = timeBytes(0x17, "invalid");
    const parsed = fromBER(input);
    expect(parsed.offset).toBe(-1);
    expect(parsed.result).toBeInstanceOf(UTCTime);
    expect(parsed.result.error).toBe("Wrong input string for conversion");

    const block = new UTCTime({ lenBlock: { length: input.length - 2 } });
    expect(block.fromBER(input, 2, input.length - 2)).toBe(-1);
    expect(block.error).toBe("Wrong input string for conversion");
  });

  it("returns an error when GeneralizedTime decoding throws", () => {
    const input = timeBytes(0x18, "invalid");
    const parsed = fromBER(input);
    expect(parsed.offset).toBe(-1);
    expect(parsed.result).toBeInstanceOf(GeneralizedTime);
    expect(parsed.result.error).toBe("Wrong input string for conversion");

    const block = new GeneralizedTime({ lenBlock: { length: input.length - 2 } });
    expect(block.fromBER(input, 2, input.length - 2)).toBe(-1);
    expect(block.error).toBe("Wrong input string for conversion");
  });

  it.each([
    [0x17, "000102121110Z", "2000-01-02T12:11:10.000Z"],
    [0x18, "20000102121110.12Z", "2000-01-02T12:11:10.120Z"],
  ])("preserves valid time decoding for tag %i", (tag, value, expected) => {
    const input = timeBytes(tag, value);
    const parsed = fromBER(input);
    expect(parsed.offset).toBe(input.length);
    expect(parsed.result.error).toBe("");
    expect(parsed.result).toBeInstanceOf(UTCTime);
    expect((parsed.result as UTCTime).toDate().toISOString()).toBe(expected);
  });

  it("preserves direct GeneralizedTime conversion exceptions", () => {
    expect(() => new GeneralizedTime({ value: "invalid" })).toThrow("Wrong input string for conversion");
    const block = new GeneralizedTime();
    expect(() => block.fromString("invalid")).toThrow("Wrong input string for conversion");
    expect(() => block.fromBuffer(new Uint8Array([0x41]))).toThrow("Wrong input string for conversion");
  });

  it("preserves exceptions from other string decoders", () => {
    const failure = new Error("Custom decoder failed");
    class CustomString extends VisibleString {
      public override fromBuffer(): void {
        throw failure;
      }
    }
    const block = new CustomString({ lenBlock: { length: 1 } });
    expect(() => block.fromBER(new Uint8Array([0x41]), 0, 1)).toThrow(failure);
  });
});

describe("BER SID leading-zero warnings", () => {
  it.each([
    ["060100", [0x06, 0x01, 0x00], "0.0"],
    ["06022a00", [0x06, 0x02, 0x2a, 0x00], "1.2.0"],
    ["0d0100", [0x0d, 0x01, 0x00], "0"],
  ])("accepts canonical zero arcs in %s without SID warnings", (_hex, values, expected) => {
    const input = new Uint8Array(values);
    const parsed = fromBER(input);
    expect(parsed.offset).toBe(input.length);
    expect(parsed.result.error).toBe("");
    expect(parsed.result).toBeInstanceOf(values[0] === 0x06 ? ObjectIdentifier : RelativeObjectIdentifier);
    const block = parsed.result as ObjectIdentifier | RelativeObjectIdentifier;
    expect(block.getValue()).toBe(expected);
    expect(block.valueBlock.value.every((sid) => sid.warnings.length === 0)).toBe(true);
  });

  it.each([
    ["06028000", [0x06, 0x02, 0x80, 0x00]],
    ["06032a8000", [0x06, 0x03, 0x2a, 0x80, 0x00]],
    ["0d028000", [0x0d, 0x02, 0x80, 0x00]],
  ])("retains the warning for nonminimal SID encoding in %s", (_hex, values) => {
    const input = new Uint8Array(values);
    const parsed = fromBER(input);
    expect(parsed.offset).toBe(input.length);
    expect(parsed.result.error).toBe("");
    const block = parsed.result as ObjectIdentifier | RelativeObjectIdentifier;
    expect(block.valueBlock.value.at(-1)?.warnings).toContain("Needlessly long format of SID encoding");
  });
});
