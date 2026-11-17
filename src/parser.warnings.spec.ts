import { describe, expect, it } from "vitest";
import { fromBER } from "./index";

describe("parser warning aggregation", () => {
  it("preserves identification warnings on the returned block", () => {
    const input = Uint8Array.of(0x9f, ...Array<number>(9).fill(0x81), 0x01, 0x00);
    const parsed = fromBER(input);
    expect(parsed.offset).toBe(input.length);
    expect(parsed.result.warnings).toContain("Tag too long, represented as hex-coded");
  });

  it("preserves length warnings on the returned block", () => {
    const parsed = fromBER(Uint8Array.of(0x04, 0x81, 0x01, 0x22));
    expect(parsed.offset).toBe(4);
    expect(parsed.result.warnings).toEqual(["Unnecessary usage of long length form"]);
  });

  it("propagates warnings from a failed child into the constructed value", () => {
    const parsed = fromBER(Uint8Array.of(0x30, 0x04, 0x04, 0x81, 0x02, 0x01));
    expect(parsed.offset).toBe(-1);
    expect(parsed.result.valueBlock.warnings).toContain("Unnecessary usage of long length form");
  });
});
