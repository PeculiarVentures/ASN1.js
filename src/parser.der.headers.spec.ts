import * as assert from "assert";
import { describe, it } from "vitest";
import { BaseBlock, Constructed, Integer, OctetString, Sequence, fromBER } from "./index";
import { createFromBerContext, localFromBER, type FromBerContext, type NodePosition } from "./parser";
import type { DerViolationCode } from "./diagnostics";
import { LocalIdentificationBlock } from "./internals/LocalIdentificationBlock";

function bytes(hex: string): Uint8Array {
  return Uint8Array.from(hex.match(/../g) ?? [], (byte) => Number.parseInt(byte, 16));
}

function nest(input: Uint8Array): Uint8Array {
  for (let depth = 0; depth < 3; depth++) input = Uint8Array.of(0x30, input.length, ...input);
  return input;
}

function summary(input: Uint8Array) {
  const decoded = fromBER(input, { encodingRules: "DER" });
  return { offset: decoded.offset, code: decoded.diagnostic?.code, tlvOffset: decoded.diagnostic?.offset, depth: decoded.diagnostic?.depth };
}

const violations: Array<{ hex: string; code: DerViolationCode; ber: boolean }> = [
  { hex: "30800201010000", code: "INDEFINITE_LENGTH", ber: true },
  { hex: "04810122", code: "NON_MINIMAL_LENGTH", ber: true },
  { hex: "0482000122", code: "NON_MINIMAL_LENGTH", ber: true },
  { hex: "1f0401ff", code: "NON_MINIMAL_TAG", ber: true },
  { hex: "9f80200101", code: "NON_MINIMAL_TAG", ber: true },
  { hex: "0000", code: "UNEXPECTED_EOC", ber: true },
  { hex: "30020000", code: "UNEXPECTED_EOC", ber: true },
  { hex: "2000", code: "UNEXPECTED_EOC", ber: true },
  { hex: "1000", code: "INVALID_FORM", ber: true },
  { hex: "1100", code: "INVALID_FORM", ber: true },
  { hex: "2a0101", code: "INVALID_FORM", ber: true },
  { hex: "24050403616263", code: "INVALID_FORM", ber: true },
  { hex: "2c050c03616263", code: "INVALID_FORM", ber: true },
  { hex: "220101", code: "INVALID_FORM", ber: false },
  { hex: "0903800001", code: "UNSUPPORTED_DER_TYPE", ber: true },
  { hex: "1f1f0100", code: "UNSUPPORTED_DER_TYPE", ber: true },
  { hex: "0f00", code: "INVALID_FORM", ber: false },
  { hex: "1f2500", code: "INVALID_FORM", ber: false },
];

describe("DER headers and forms", () => {
  it("accepts canonical headers for universal and non-universal forms", () => {
    const inputs = ["020101", "0500", "3000", "3100", "9f200101", "4000", "8000", "c000", "a003020101", "1400", "1500", "1900", "1b00"];
    for (const hex of inputs) {
      const input = bytes(hex);
      const decoded = fromBER(input, { encodingRules: "DER" });
      assert.strictEqual(decoded.offset, input.length, hex);
      assert.strictEqual(decoded.diagnostic, undefined, hex);
    }

    for (const length of [127, 128]) {
      const input = Uint8Array.of(0x04, ...(length === 127 ? [127] : [0x81, 128]), ...new Uint8Array(length));
      assert.strictEqual(fromBER(input, { encodingRules: "DER" }).offset, input.length);
    }
  });

  it("reports stable codes and root positions without changing BER acceptance", () => {
    for (const { hex, code, ber } of violations) {
      const input = bytes(hex);
      for (const options of [{}, { requireFullInput: true }]) {
        const decoded = fromBER(input, options);
        assert.strictEqual(decoded.offset !== -1, ber, `${hex} BER`);
        assert.strictEqual(decoded.diagnostic, undefined, `${hex} BER diagnostic`);
      }

      const decoded = fromBER(input, { encodingRules: "DER" });
      assert.strictEqual(decoded.offset, -1, hex);
      assert.strictEqual(decoded.diagnostic?.code, code, hex);
      assert.strictEqual(decoded.diagnostic?.offset, hex === "30020000" ? 2 : 0, hex);
      assert.strictEqual(decoded.diagnostic?.depth, hex === "30020000" ? 1 : 0, hex);
      assert.strictEqual(decoded.diagnostic?.byteOffset, undefined, hex);
      assert.strictEqual(decoded.result.error, decoded.diagnostic?.message, hex);
    }
  });

  it("locates header and form violations three SEQUENCE levels deep", () => {
    for (const { hex, code } of violations) {
      const decoded = fromBER(nest(bytes(hex)), { encodingRules: "DER" });
      assert.strictEqual(decoded.offset, -1, hex);
      assert.strictEqual(decoded.diagnostic?.code, code, hex);
      assert.strictEqual(decoded.diagnostic?.offset, hex === "30020000" ? 8 : 6, hex);
      assert.strictEqual(decoded.diagnostic?.depth, hex === "30020000" ? 4 : 3, hex);
    }
  });

  it("requires complete DER input and rejects contradictory options", () => {
    const trailing = fromBER(bytes("020101ff"), { encodingRules: "DER" });
    assert.strictEqual(trailing.offset, -1);
    assert.strictEqual(trailing.diagnostic?.code, "TRAILING_DATA");
    assert.strictEqual(trailing.diagnostic?.offset, 3);
    assert.strictEqual(trailing.diagnostic?.depth, 0);
    assert.throws(() => fromBER(bytes("020101"), { encodingRules: "DER", requireFullInput: false }), TypeError);
    assert.throws(() => fromBER(new ArrayBuffer(0), { encodingRules: "DER", requireFullInput: false }), TypeError);

    const opaque = fromBER(bytes("0403020101"), { encodingRules: "DER" });
    assert.deepStrictEqual((opaque.result as OctetString).valueBlock.value, []);
  });

  it("keeps malformed data and resource limits outside DER diagnostics", () => {
    const cases = [
      fromBER(bytes("020201"), { encodingRules: "DER" }),
      fromBER(bytes("020101"), { encodingRules: "DER", maxNodes: 0 }),
      fromBER(bytes("020101"), { encodingRules: "DER", maxContentLength: 0 }),
      fromBER(bytes("3003020101"), { encodingRules: "DER", maxDepth: 0 }),
    ];
    for (const decoded of cases) {
      assert.strictEqual(decoded.offset, -1);
      assert.strictEqual(decoded.diagnostic, undefined);
    }
  });

  it("matches fast and generic results for acceptance, codes, and positions", () => {
    const inputs = [bytes("020101"), bytes("0500"), bytes("3003020101"), bytes("30021000"), bytes("30040500ffff"), ...violations.map(({ hex }) => nest(bytes(hex)))];
    const fast = inputs.map(summary);
    const descriptor = Object.getOwnPropertyDescriptor(LocalIdentificationBlock.prototype, "fromBER");
    assert.ok(descriptor && "value" in descriptor);
    const original = descriptor.value as LocalIdentificationBlock["fromBER"];
    Object.defineProperty(LocalIdentificationBlock.prototype, "fromBER", {
      ...descriptor,
      value: function (this: LocalIdentificationBlock, ...args: Parameters<LocalIdentificationBlock["fromBER"]>) {
        return Reflect.apply(original, this, args);
      },
    });
    try {
      assert.deepStrictEqual(inputs.map(summary), fast);
    } finally {
      Object.defineProperty(LocalIdentificationBlock.prototype, "fromBER", descriptor);
    }
  });

  it("restores the parent node after child decoding and the caller node on exit", () => {
    const original = BaseBlock.prototype.fromBER;
    const originalConstructed = Constructed.prototype.fromBER;
    const seen: Array<{ tag: number; phase: string; node: NodePosition | undefined }> = [];
    function record(decoder: BaseBlock["fromBER"]): BaseBlock["fromBER"] {
      return function (this: BaseBlock, input, offset, length, context) {
        seen.push({ tag: this.idBlock.tagNumber, phase: "before", node: context?.node && { ...context.node } });
        const result = Reflect.apply(decoder, this, [input, offset, length, context]);
        seen.push({ tag: this.idBlock.tagNumber, phase: "after", node: context?.node && { ...context.node } });
        return result;
      };
    }
    BaseBlock.prototype.fromBER = record(original);
    Constructed.prototype.fromBER = record(originalConstructed);
    try {
      const context: FromBerContext = createFromBerContext({ encodingRules: "DER" });
      const callerNode = { tlvOffset: 7, contentOffset: 9, depth: 2 };
      context.node = callerNode;
      context.baseOffset = 17;
      context.positions = new WeakMap();
      const decoded = localFromBER(Uint8Array.of(0xee, ...bytes("3003020101"), 0xdd), 1, 5, context);
      assert.strictEqual(decoded.offset, 6);
      assert.strictEqual(context.node, callerNode);
      assert.strictEqual(context.depth, 0);
      assert.deepStrictEqual(seen, [
        { tag: 16, phase: "before", node: { tlvOffset: 18, contentOffset: 20, depth: 0 } },
        { tag: 2, phase: "before", node: { tlvOffset: 20, contentOffset: 22, depth: 1 } },
        { tag: 2, phase: "after", node: { tlvOffset: 20, contentOffset: 22, depth: 1 } },
        { tag: 16, phase: "after", node: { tlvOffset: 18, contentOffset: 20, depth: 0 } },
      ]);
      const sequence = decoded.result as Sequence;
      assert.deepStrictEqual(context.positions.get(sequence), { tlvOffset: 18, contentOffset: 20, depth: 0 });
      assert.deepStrictEqual(context.positions.get(sequence.valueBlock.value[0] as Integer), { tlvOffset: 20, contentOffset: 22, depth: 1 });
    } finally {
      BaseBlock.prototype.fromBER = original;
      Constructed.prototype.fromBER = originalConstructed;
    }
  });
});
