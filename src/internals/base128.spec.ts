import * as assert from "node:assert/strict";
import { describe, it } from "vitest";
import { ObjectIdentifier, RelativeObjectIdentifier, fromBER } from "../index";
import { encodeBase128 } from "./integerUtils";

// An independent oracle: split the binary representation into seven-bit groups.
function binaryDigits(value: bigint): Uint8Array {
  const binary = value.toString(2);
  const padded = binary.padStart(Math.ceil(binary.length / 7) * 7, "0");
  return Uint8Array.from(padded.match(/.{7}/g)!, (digit) => parseInt(digit, 2));
}

describe("base-128 encoding", () => {
  it("preserves zero, fixed encodings, and number/bigint agreement", () => {
    const vectors: [bigint, number[]][] = [
      [0n, [0]],
      [1n, [1]],
      [127n, [127]],
      [128n, [1, 0]],
      [16383n, [127, 127]],
      [16384n, [1, 0, 0]],
      [268435455n, [127, 127, 127, 127]],
      [268435456n, [1, 0, 0, 0, 0]],
      [9007199254740991n, [15, 127, 127, 127, 127, 127, 127, 127]],
      [9007199254740992n, [16, 0, 0, 0, 0, 0, 0, 0]],
      [9007199254740993n, [16, 0, 0, 0, 0, 0, 0, 1]],
    ];

    for (const [value, expected] of vectors) {
      assert.deepEqual(encodeBase128(value), Uint8Array.from(expected));
      if (value <= BigInt(Number.MAX_SAFE_INTEGER)) {
        assert.deepEqual(encodeBase128(Number(value)), Uint8Array.from(expected));
      }
    }
    assert.deepEqual(encodeBase128(-0), Uint8Array.of(0));
  });

  it("rejects negative bigints and invalid or unsafe numbers", () => {
    for (const value of [-1n, -(1n << 1000n), -1, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      assert.equal(encodeBase128(value), undefined);
    }
  });

  it("matches binary groups across bit, hex, and chunk boundaries", () => {
    for (let bits = 0; bits <= 256; bits++) {
      const power = 1n << BigInt(bits);
      for (const value of [power - 1n, power, power + 1n]) {
        assert.deepEqual(encodeBase128(value), binaryDigits(value), `bit boundary ${bits}, value ${value}`);
      }
    }
  });

  it("preserves mixed digits and zero-filled interior chunks", () => {
    let seed = 0x12345678;
    let hexadecimal = "";
    for (let chunk = 0; chunk < 128; chunk++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      hexadecimal += seed.toString(16).padStart(8, "0");
      const value = BigInt(`0x${hexadecimal}`);
      assert.deepEqual(encodeBase128(value), binaryDigits(value));
    }
    const sparse = (1n << 1024n) + (1n << 56n) + 1n;
    assert.deepEqual(encodeBase128(sparse), binaryDigits(sparse));
  });

  it("encodes a very large component with exact minimal digits", () => {
    const digits = 50000;
    const value = (1n << BigInt(digits * 7)) - 1n;
    assert.deepEqual(encodeBase128(value), new Uint8Array(digits).fill(127));
  });
});

describe("large OID component encoding", () => {
  it("preserves predetermined mixed digits in first, later, and relative SIDs", () => {
    const expected = Uint8Array.from({ length: 4096 }, (_, index) => (index === 0 ? 1 : (index * 37) % 128));
    const binary = Array.from(expected, (digit) => digit.toString(2).padStart(7, "0")).join("");
    const value = BigInt(`0b${binary}`);
    const content = Uint8Array.from(expected, (digit, index) => (index + 1 < expected.length ? digit | 0x80 : digit));

    const cases = [
      { Type: ObjectIdentifier, decimal: `2.${value - 80n}`, prefix: [] },
      { Type: ObjectIdentifier, decimal: `1.2.${value}`, prefix: [0x2a] },
      { Type: RelativeObjectIdentifier, decimal: value.toString(), prefix: [] },
    ];
    for (const { Type, decimal, prefix } of cases) {
      const expectedContent = Uint8Array.from([...prefix, ...content]);
      const oid = new Type({ value: decimal });
      assert.deepEqual(oid.valueBlock.value.at(-1)!.valueHexView, expected);
      assert.deepEqual(new Uint8Array(oid.valueBlock.toBER()), expectedContent);
      oid.setValue(decimal);
      assert.deepEqual(new Uint8Array(oid.valueBlock.toBER()), expectedContent);
    }
  });

  for (const Type of [ObjectIdentifier, RelativeObjectIdentifier]) {
    for (const strict of [false, true]) {
      it(`${Type.NAME} preserves large decimal components (strict=${strict})`, () => {
        const component = "9".repeat(2000);
        const value = Type === ObjectIdentifier ? `2.25.${component}` : component;
        const expected = binaryDigits(BigInt(component));
        const oid = new Type({ value, strict });
        const sid = oid.valueBlock.value.at(-1)!;
        assert.deepEqual(sid.valueHexView, expected);
        assert.equal(oid.error, "");
        assert.equal(oid.getValue(), value);

        // Check the content octets independently of the library's BER decoder.
        const content = Uint8Array.from(expected, (digit, index) => (index + 1 < expected.length ? digit | 0x80 : digit));
        const expectedContent = Type === ObjectIdentifier ? Uint8Array.from([0x69, ...content]) : content;
        assert.deepEqual(new Uint8Array(oid.valueBlock.toBER()), expectedContent);
        const ber = oid.toBER();
        assert.equal(oid.toBER(true).byteLength, ber.byteLength);
        const decoded = fromBER(ber);
        assert.equal(decoded.offset, ber.byteLength);
        assert.equal(decoded.result.valueBlock.toString(), value);
        assert.deepEqual(decoded.result.toBER(), ber);
        oid.setValue(value);
        assert.deepEqual(oid.toBER(), ber);
      });
    }
  }
});
