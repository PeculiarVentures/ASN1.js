import { describe, expect, it } from "vitest";
import { LocalRelativeSidValueBlock } from "../src/internals/LocalRelativeSidValueBlock";
import { LocalSidValueBlock } from "../src/internals/LocalSidValueBlock";

const bytes = (...values: number[]) => new Uint8Array(values);
const sidBytes = (length: number) => Uint8Array.from({ length }, (_, i) => (i === length - 1 ? 1 : 0x81));
const parseAll = (Block: typeof LocalSidValueBlock | typeof LocalRelativeSidValueBlock, input: Uint8Array) => {
  let block = new Block();
  let offset = 0;
  while (offset < input.length) {
    block = new Block();
    const next = block.fromBER(input, offset, input.length - offset);
    expect(next).toBe(offset + 1);
    offset = next;
  }
  return block;
};

describe("Local SID value block performance contract", () => {
  for (const Block of [LocalSidValueBlock, LocalRelativeSidValueBlock]) {
    it(`${Block.NAME} parses one-byte and 7/8/9/10-octet SIDs from nonzero offsets`, () => {
      const input = bytes(0xaa, 1, 0x81, 1, 0x81, 0x81, 1, 0x81, 0x81, 0x81, 1, 0x81, 0x81, 0x81, 0x81, 1);
      const block = new Block();
      expect(block.fromBER(input.subarray(1), 0, 1)).toBe(1);
      for (const length of [7, 8, 9, 10]) {
        const sid = sidBytes(length),
          fresh = new Block(),
          next = fresh.fromBER(sid, 0, sid.length);
        expect(next).toBe(length);
        expect(fresh.valueHexView.length).toBe(length);
      }
      if (Block === LocalSidValueBlock) {
        const first = new LocalSidValueBlock({ isFirstSid: true });
        expect(first.fromBER(bytes(42), 0, 1)).toBe(1);
        expect(first.toString()).toBe("1.2");
      }
    });

    it(`${Block.NAME} parses complete 256 and 8192 short components`, () => {
      for (const length of [256, 8192]) {
        const input = new Uint8Array(length).fill(1);
        const block = parseAll(Block, input);
        expect(block.blockLength).toBe(1);
        expect(block.valueHexView[0]).toBe(1);
      }
    });

    it(`${Block.NAME} preserves masked bytes, leading-zero warnings, truncation, and empty input`, () => {
      const block = new Block();
      expect(block.fromBER(bytes(0x81, 0x80, 1), 0, 3)).toBe(3);
      expect(Array.from(block.valueHexView)).toEqual([1, 0, 1]);
      expect(block.fromBER(bytes(0), 0, 0)).toBe(0);
      const leading = new Block();
      expect(leading.fromBER(bytes(0x00, 1), 0, 2)).toBe(1);
      expect(leading.warnings[0]).toBe("Needlessly long format of SID encoding");
      const truncated = new Block();
      expect(truncated.fromBER(bytes(0x81), 0, 1)).toBe(-1);
      expect(truncated.error).toBe("End of input reached before message was fully decoded");
      expect(Array.from(truncated.valueHexView)).toEqual([1]);
    });

    it(`${Block.NAME} retains accumulated block length on repeated and invalid calls`, () => {
      const block = new Block();
      expect(block.fromBER(bytes(1), 0, 1)).toBe(1);
      expect(block.blockLength).toBe(1);
      expect(block.fromBER(bytes(1), 0, 2)).toBe(-1);
      expect(block.blockLength).toBe(1);
      expect(block.fromBER(bytes(1), 0, 1)).toBe(2);
      expect(block.blockLength).toBe(2);
      expect(block.valueHexView.length).toBe(2);
    });

    it(`${Block.NAME} keeps toBER and copying getter behavior`, () => {
      const block = new Block();
      expect(block.fromBER(bytes(0x81, 1), 0, 2)).toBe(2);
      const copy = block.valueHex;
      new Uint8Array(copy)[0] ^= 1;
      expect(Array.from(block.valueHexView)).toEqual([1, 1]);
      expect(Array.from(new Uint8Array(block.toBER(false)))).toEqual([0x81, 1]);
      expect(new Uint8Array(block.toBER(true)).length).toBe(2);
    });
  }
});
