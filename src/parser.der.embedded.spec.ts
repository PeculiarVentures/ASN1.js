import * as assert from "assert";
import { describe, it } from "vitest";
import { type BaseBlock, BitString, Boolean, Choice, Integer, OctetString, Repeated, Sequence, fromBER, verifySchema } from "./index";
import { createFromBerContext, localFromBER, withHeuristic } from "./parser";
import type { ParseDiagnostic } from "./diagnostics";

function bytes(hex: string): Uint8Array {
  return Uint8Array.from(hex.match(/../g) ?? [], (byte) => Number.parseInt(byte, 16));
}

function children(result: ReturnType<typeof fromBER>): BaseBlock[] {
  return (result.result as BitString | OctetString).valueBlock.value;
}

function requiredInteger(): OctetString {
  return new OctetString({ primitiveSchema: new Integer() });
}

describe("DER embedded heuristics", () => {
  it("defaults to opaque content and permits validated children when explicitly enabled", () => {
    for (const input of [bytes("0403020101"), bytes("030400020101")]) {
      const opaque = fromBER(input, { encodingRules: "DER" });
      const embedded = fromBER(input, { encodingRules: "DER", parseEmbedded: true });
      assert.strictEqual(opaque.offset, input.length);
      assert.deepStrictEqual(children(opaque), []);
      assert.strictEqual(embedded.offset, input.length);
      assert.strictEqual(children(embedded).length, 1);
      assert.ok(children(embedded)[0] instanceof Integer);
      assert.deepStrictEqual(new Uint8Array(embedded.result.toBER()), input);
    }
  });

  it("discards failed and partially consumed attempts without diagnostic leakage", () => {
    for (const input of [bytes("040402020001"), bytes("03050002020001"), bytes("0404020101ff"), bytes("0403090100")]) {
      const decoded = fromBER(input, { encodingRules: "DER", parseEmbedded: true });
      assert.strictEqual(decoded.offset, input.length);
      assert.strictEqual(decoded.result.error, "");
      assert.strictEqual(decoded.diagnostic, undefined);
      assert.deepStrictEqual(children(decoded), []);
    }

    for (const [input, offset] of [
      [bytes("300a04040202000102020001"), 8],
      [bytes("300b0305000202000102020001"), 9],
    ] as const) {
      const decoded = fromBER(input, { encodingRules: "DER", parseEmbedded: true });
      assert.strictEqual(decoded.offset, -1);
      assert.strictEqual(decoded.diagnostic?.code, "NON_MINIMAL_INTEGER");
      assert.strictEqual(decoded.diagnostic?.offset, offset);
      assert.strictEqual(decoded.diagnostic?.byteOffset, offset + 2);
      assert.strictEqual(decoded.diagnostic?.depth, 1);
    }
  });

  it("caps total speculative work independently from mandatory nodes", () => {
    const octet = bytes("0409300702010102020001");
    const input = Uint8Array.of(0x30, octet.length * 6, ...Array.from({ length: 6 }, () => Array.from(octet)).flat());
    const context = createFromBerContext({ encodingRules: "DER", parseEmbedded: true, maxNodes: 7 });
    const decoded = localFromBER(input, 0, input.length, context);
    assert.strictEqual(decoded.offset, input.length);
    assert.strictEqual(decoded.diagnostic, undefined);
    assert.strictEqual(context.nodesCount, 7);
    assert.strictEqual(context.heuristic?.maxNodes, 7);
    assert.strictEqual(context.heuristic?.nodesSpent, 7);
    assert.strictEqual(context.heuristic?.active, false);
    for (const octetValue of (decoded.result as Sequence).valueBlock.value as OctetString[]) {
      assert.deepStrictEqual(octetValue.valueBlock.value, []);
    }
  });

  it("shares the work budget with nested heuristic attempts", () => {
    const input = bytes("04050403020101");
    const context = createFromBerContext({ encodingRules: "DER", parseEmbedded: true, maxNodes: 1 });
    const decoded = localFromBER(input, 0, input.length, context);
    assert.strictEqual(decoded.offset, input.length);
    assert.strictEqual(context.nodesCount, 1);
    assert.strictEqual(context.heuristic?.nodesSpent, 1);
    assert.strictEqual(children(decoded).length, 1);
    assert.deepStrictEqual((children(decoded)[0] as OctetString).valueBlock.value, []);
  });

  it("restores parse state after an exception while retaining spent work", () => {
    const context = createFromBerContext({ encodingRules: "DER", maxNodes: 3 });
    const node = { tlvOffset: 4, contentOffset: 6, depth: 2 };
    const diagnostic: ParseDiagnostic = { code: "INVALID_FORM", message: "saved", offset: 4, depth: 2 };
    context.node = node;
    context.diagnostic = diagnostic;
    context.depth = 2;
    context.baseOffset = 4;
    context.nodesCount = 2;
    assert.throws(() =>
      withHeuristic(context, () => {
        localFromBER(bytes("020101"), 0, 3, context);
        context.depth = 7;
        context.baseOffset = 99;
        context.node = { tlvOffset: 99, contentOffset: 100, depth: 7 };
        throw new Error("test interruption");
      }),
    );
    assert.strictEqual(context.node, node);
    assert.strictEqual(context.diagnostic, diagnostic);
    assert.strictEqual(context.depth, 2);
    assert.strictEqual(context.baseOffset, 4);
    assert.strictEqual(context.nodesCount, 2);
    assert.strictEqual(context.heuristic?.nodesSpent, 1);
    assert.strictEqual(context.heuristic?.active, false);
  });
});

describe("primitiveSchema parser context", () => {
  it("propagates required DER failures with root-relative positions", () => {
    const schema = new OctetString({ primitiveSchema: new Integer() });
    const decoded = verifySchema(bytes("040402020001"), schema, { encodingRules: "DER" });
    assert.strictEqual(decoded.verified, false);
    if (!decoded.verified) {
      assert.strictEqual(decoded.diagnostic?.code, "NON_MINIMAL_INTEGER");
      assert.strictEqual(decoded.diagnostic?.offset, 2);
      assert.strictEqual(decoded.diagnostic?.byteOffset, 4);
      assert.strictEqual(decoded.diagnostic?.depth, 1);
    }
    assert.strictEqual(verifySchema(bytes("0403020101"), schema, { encodingRules: "DER" }).verified, true);
    assert.strictEqual(verifySchema(bytes("040402020001"), schema).verified, true);
  });

  it("preserves absolute positions across nested primitive schemas and BIT STRING content", () => {
    const nestedSchema = new Sequence({ value: [new Sequence({ value: [new Sequence({ value: [new OctetString({ primitiveSchema: new Integer() })] })] })] });
    const nested = verifySchema(bytes("300a30083006040402020001"), nestedSchema, { encodingRules: "DER" });
    assert.strictEqual(nested.verified, false);
    if (!nested.verified) {
      assert.strictEqual(nested.diagnostic?.offset, 8);
      assert.strictEqual(nested.diagnostic?.depth, 4);
    }

    for (const copyInput of [true, false]) {
      const schema = new Sequence({ value: [new BitString({ primitiveSchema: new Integer() })] });
      const backing = Uint8Array.of(0xee, ...bytes("300703050002020001"), 0xdd);
      const bit = verifySchema(backing.subarray(1, 10), schema, { encodingRules: "DER", copyInput });
      assert.strictEqual(bit.verified, false);
      if (!bit.verified) {
        assert.strictEqual(bit.diagnostic?.offset, 5);
        assert.strictEqual(bit.diagnostic?.byteOffset, 7);
        assert.strictEqual(bit.diagnostic?.depth, 2);
      }
    }

    const double = verifySchema(bytes("0406040402020001"), new OctetString({ primitiveSchema: new OctetString({ primitiveSchema: new Integer() }) }), { encodingRules: "DER" });
    assert.strictEqual(double.verified, false);
    if (!double.verified) {
      assert.strictEqual(double.diagnostic?.offset, 4);
      assert.strictEqual(double.diagnostic?.depth, 2);
    }
  });

  it("requires full consumption in DER and explicitly complete BER schema parsing", () => {
    for (const options of [{ encodingRules: "DER" as const }, { encodingRules: "BER" as const, requireFullInput: true }]) {
      const decoded = verifySchema(bytes("0404020101ff"), new OctetString({ primitiveSchema: new Integer() }), options);
      assert.strictEqual(decoded.verified, false);
      if (!decoded.verified) {
        assert.strictEqual(decoded.diagnostic?.code, "TRAILING_DATA");
        assert.strictEqual(decoded.diagnostic?.offset, 5);
        assert.strictEqual(decoded.diagnostic?.depth, 1);
      }
    }
  });

  it("shares depth and node limits with required primitive schema decoding", () => {
    for (const options of [{ maxNodes: 1 }, { maxDepth: 0 }]) {
      const decoded = verifySchema(bytes("0403020101"), new OctetString({ primitiveSchema: new Integer() }), { ...options, encodingRules: "DER" });
      assert.strictEqual(decoded.verified, false);
      if (!decoded.verified) {
        assert.match(decoded.result.error, /Maximum ASN.1/);
        assert.strictEqual(decoded.diagnostic, undefined);
      }
    }
    const permitted = verifySchema(bytes("0403020101"), new OctetString({ primitiveSchema: new Integer() }), { encodingRules: "DER", maxNodes: 2, maxDepth: 1 });
    assert.strictEqual(permitted.verified, true);
  });

  it("allows schema alternatives after invalid embedded DER but keeps resource failures fatal", () => {
    const schemas = [
      new Choice({ value: [requiredInteger(), new OctetString()] }),
      new Sequence({ value: [new OctetString({ primitiveSchema: new Integer(), optional: true }), new OctetString()] }),
      new Sequence({ value: [new Repeated({ value: requiredInteger(), optional: true })] }),
    ];
    const inputs = [bytes("040402020001"), bytes("3006040402020001"), bytes("300b0404020200010403020101")];
    schemas.forEach((schema, index) => {
      const decoded = verifySchema(inputs[index], schema, { encodingRules: "DER" });
      assert.strictEqual(decoded.verified, true);
    });

    const required = verifySchema(inputs[2], new Sequence({ value: [new Repeated({ value: requiredInteger() })] }), { encodingRules: "DER" });
    assert.strictEqual(required.verified, false);
    if (!required.verified) assert.strictEqual(required.diagnostic?.code, "NON_MINIMAL_INTEGER");

    const limited = verifySchema(bytes("0403020101"), new Choice({ value: [requiredInteger(), new OctetString()] }), { encodingRules: "DER", maxNodes: 1 });
    assert.strictEqual(limited.verified, false);
    if (!limited.verified) assert.match(limited.result.error, /Maximum ASN.1 node count/);
  });

  it("counts failed schema attempts against explicitly shared resource limits", () => {
    for (const encodingRules of ["BER", "DER"] as const) {
      const schema = new Choice({ value: [new OctetString({ primitiveSchema: new Boolean() }), requiredInteger(), new OctetString()] });
      const limited = verifySchema(bytes("0403020101"), schema, { encodingRules, parseEmbedded: false, maxNodes: 2 });
      assert.strictEqual(limited.verified, false);
      if (!limited.verified) assert.match(limited.result.error, /Maximum ASN.1 node count/);
    }
  });

  it("enforces an explicit depth limit across nested BER and DER primitive schemas", () => {
    for (const encodingRules of ["BER", "DER"] as const) {
      const schema = new OctetString({ primitiveSchema: new OctetString({ primitiveSchema: new Integer() }) });
      const limited = verifySchema(bytes("04050403020101"), schema, { encodingRules, parseEmbedded: false, maxDepth: 1 });
      assert.strictEqual(limited.verified, false);
      if (!limited.verified) assert.match(limited.result.error, /Maximum ASN.1 nesting depth/);
    }
  });

  it("does not leak diagnostics from an unsuccessful alternative to a later mandatory value", () => {
    const schema = new Sequence({ value: [new Choice({ value: [requiredInteger(), new OctetString()] }), requiredInteger()] });
    const decoded = verifySchema(bytes("300c040402020001040402020002"), schema, { encodingRules: "DER" });
    assert.strictEqual(decoded.verified, false);
    if (!decoded.verified) {
      assert.strictEqual(decoded.diagnostic?.code, "NON_MINIMAL_INTEGER");
      assert.strictEqual(decoded.diagnostic?.offset, 10);
      assert.strictEqual(decoded.diagnostic?.depth, 2);
    }
  });
});
