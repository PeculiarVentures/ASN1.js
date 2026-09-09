import * as assert from "assert";
import { BitString, OctetString, fromBER } from "../src";
import { type FromBerContext, localFromBER } from "../src/parser";
import { LocalBitStringValueBlock } from "../src/internals/LocalBitStringValueBlock";

function parse(input: number[], options?: { parseEmbedded?: boolean; maxDepth?: number; maxNodes?: number }) {
  return fromBER(Uint8Array.from(input), options);
}

function bytes(value: { toBER: () => ArrayBuffer }): number[] {
  return Array.from(new Uint8Array(value.toBER()));
}

function valueChildren(result: { result: unknown }): unknown[] {
  return ((result.result as OctetString | BitString).valueBlock as unknown as { value: unknown[] }).value;
}

describe("parseEmbedded parser option", () => {
  it("keeps default and explicit true trees identical while disabling heuristic children", () => {
    const cases: Array<{ name: string; input: number[]; expectedChildren?: number }> = [
      { name: "OCTET exact TLV", input: [0x04, 0x03, 0x02, 0x01, 0x01], expectedChildren: 1 },
      { name: "OCTET trailing payload", input: [0x04, 0x04, 0x02, 0x01, 0x01, 0xff] },
      { name: "OCTET non-ASN.1 payload", input: [0x04, 0x03, 0xff, 0xff, 0xff] },
      { name: "OCTET nested TLV", input: [0x04, 0x05, 0x30, 0x03, 0x02, 0x01, 0x01], expectedChildren: 1 },
      { name: "BIT STRING exact TLV", input: [0x03, 0x04, 0x00, 0x02, 0x01, 0x01], expectedChildren: 1 },
      { name: "BIT STRING trailing payload", input: [0x03, 0x05, 0x00, 0x02, 0x01, 0x01, 0xff] },
      { name: "BIT STRING non-ASN.1 payload", input: [0x03, 0x04, 0x00, 0xff, 0xff, 0xff] },
      { name: "BIT STRING nested TLV", input: [0x03, 0x06, 0x00, 0x30, 0x03, 0x02, 0x01, 0x01], expectedChildren: 1 },
      { name: "BIT STRING nonzero unused bits", input: [0x03, 0x03, 0x01, 0x02, 0x01] }
    ];

    for (const { name, input, expectedChildren } of cases) {
      const defaultResult = parse(input);
      const explicitResult = parse(input, { parseEmbedded: true });
      const disabledResult = parse(input, { parseEmbedded: false });

      assert.deepStrictEqual(explicitResult, defaultResult, name);
      assert.strictEqual(defaultResult.offset, input.length, name);
      assert.strictEqual(disabledResult.offset, input.length, name);
      if (expectedChildren !== undefined)
        assert.strictEqual(valueChildren(defaultResult).length, expectedChildren, name);
      assert.deepStrictEqual(valueChildren(disabledResult), [], name);
      assert.deepStrictEqual(
        Array.from((disabledResult.result as OctetString | BitString).valueBeforeDecodeView),
        input,
        name
      );
      assert.deepStrictEqual(
        Array.from((disabledResult.result as OctetString | BitString).valueBlock.valueHexView),
        Array.from((defaultResult.result as OctetString | BitString).valueBlock.valueHexView),
        name
      );
      assert.deepStrictEqual(bytes(disabledResult.result as OctetString | BitString), input, name);
    }
  });

  it("continues parsing required constructed OCTET and BIT STRING children", () => {
    const cases = [
      [0x24, 0x03, 0x04, 0x01, 0x01],
      [0x24, 0x80, 0x04, 0x01, 0x01, 0x00, 0x00],
      [0x23, 0x03, 0x03, 0x01, 0x00],
      [0x23, 0x80, 0x03, 0x01, 0x00, 0x00, 0x00]
    ];

    for (const input of cases) {
      const result = parse(input, { parseEmbedded: false });
      assert.strictEqual(result.offset, input.length);
      assert.strictEqual(valueChildren(result).length, 1);
      assert.deepStrictEqual(bytes(result.result as OctetString | BitString), input);
    }
  });

  it("keeps resource checks active for constructed children when disabled", () => {
    const octet = parse([0x24, 0x03, 0x04, 0x01, 0x01], { parseEmbedded: false, maxNodes: 1 });
    assert.strictEqual(octet.offset, -1);
    assert.strictEqual(octet.result.error, "Maximum ASN.1 node count exceeded");

    const bit = parse([0x23, 0x03, 0x03, 0x01, 0x00], { parseEmbedded: false, maxDepth: 0 });
    assert.strictEqual(bit.offset, -1);
    assert.strictEqual(bit.result.error, "Maximum ASN.1 nesting depth exceeded");
  });

  it("retains heuristic parsing for direct decoders without a context", () => {
    const octet = new OctetString();
    octet.lenBlock.length = 3;
    const octetContent = Uint8Array.of(0x02, 0x01, 0x01);
    assert.strictEqual(octet.fromBER(octetContent, 0, octetContent.length), octetContent.length);
    assert.strictEqual(octet.valueBlock.value.length, 1);

    const bit = new LocalBitStringValueBlock();
    const bitContent = Uint8Array.of(0x00, 0x02, 0x01, 0x01);
    assert.strictEqual(bit.fromBER(bitContent, 0, bitContent.length), bitContent.length);
    assert.strictEqual(bit.value.length, 1);
  });

  it("accepts contexts without parseEmbedded and preserves the default heuristic", () => {
    const context: FromBerContext = {
      depth: 0,
      maxDepth: 100,
      nodesCount: 0,
      maxNodes: 10,
      maxContentLength: 100
    };
    const result = localFromBER(Uint8Array.of(0x04, 0x03, 0x02, 0x01, 0x01), 0, 5, context);
    assert.strictEqual(result.offset, 5);
    assert.strictEqual((result.result as OctetString).valueBlock.value.length, 1);
  });
});

describe("copyInput parser option", () => {
  const seed = [0x04, 0x03, 0xaa, 0xbb, 0xcc];

  function inputCases(): Array<{
    name: string;
    create: () => { input: ArrayBuffer | Uint8Array | DataView; backing: Uint8Array };
  }> {
    return [
      {
        name: "ArrayBuffer",
        create: () => {
          const backing = Uint8Array.from(seed);
          return { input: backing.buffer, backing };
        }
      },
      {
        name: "Uint8Array subview",
        create: () => {
          const backing = Uint8Array.of(0xee, ...seed, 0xdd);
          return { input: backing.subarray(1, 6), backing };
        }
      },
      {
        name: "Buffer slice",
        create: () => {
          const backing = Buffer.from([0xee, ...seed, 0xdd]);
          return {
            input: backing.subarray(1, 6),
            backing: new Uint8Array(backing.buffer, backing.byteOffset, backing.byteLength)
          };
        }
      },
      {
        name: "DataView",
        create: () => {
          const backing = Uint8Array.of(0xee, ...seed, 0xdd);
          return { input: new DataView(backing.buffer, 1, seed.length), backing };
        }
      }
    ];
  }

  function observable(result: ReturnType<typeof fromBER>) {
    const block = result.result as OctetString;
    return {
      offset: result.offset,
      valueBeforeDecodeView: Array.from(block.valueBeforeDecodeView),
      valueHexView: Array.from(block.valueBlock.valueHexView),
      valueBeforeDecode: Array.from(new Uint8Array(block.valueBeforeDecode)),
      valueHex: Array.from(new Uint8Array(block.valueBlock.valueHex)),
      ber: bytes(block)
    };
  }

  it("keeps defaults copied and copyInput false aliased for every supported input view", () => {
    for (const { name, create } of inputCases()) {
      const defaultInput = create();
      const defaultResult = fromBER(defaultInput.input);
      const defaultBefore = observable(defaultResult);
      defaultInput.backing[defaultInput.backing.length === seed.length ? 2 : 3] = 0x99;
      assert.deepStrictEqual(observable(defaultResult), defaultBefore, name);

      const explicitInput = create();
      const explicitResult = fromBER(explicitInput.input, { copyInput: true });
      const explicitBefore = observable(explicitResult);
      explicitInput.backing[explicitInput.backing.length === seed.length ? 2 : 3] = 0x99;
      assert.deepStrictEqual(observable(explicitResult), explicitBefore, name);
      assert.deepStrictEqual(defaultBefore, explicitBefore, name);
      assert.deepStrictEqual(
        explicitBefore,
        {
          offset: seed.length,
          valueBeforeDecodeView: seed,
          valueHexView: seed.slice(2),
          valueBeforeDecode: seed,
          valueHex: seed.slice(2),
          ber: seed
        },
        name
      );

      const aliasedInput = create();
      const aliasedResult = fromBER(aliasedInput.input, { copyInput: false });
      const aliasedBlock = aliasedResult.result as OctetString;
      const borrowedBeforeDecode = aliasedBlock.valueBeforeDecode;
      const borrowedValueHex = aliasedBlock.valueBlock.valueHex;
      aliasedInput.backing[aliasedInput.backing.length === seed.length ? 2 : 3] = 0x99;
      assert.deepStrictEqual(Array.from(aliasedBlock.valueBeforeDecodeView), [0x04, 0x03, 0x99, 0xbb, 0xcc], name);
      assert.deepStrictEqual(Array.from(aliasedBlock.valueBlock.valueHexView), [0x99, 0xbb, 0xcc], name);
      assert.deepStrictEqual(observable(aliasedResult).ber, [0x04, 0x03, 0x99, 0xbb, 0xcc], name);
      assert.deepStrictEqual(Array.from(new Uint8Array(borrowedBeforeDecode)), seed, name);
      assert.deepStrictEqual(Array.from(new Uint8Array(borrowedValueHex)), seed.slice(2), name);
      assert.deepStrictEqual(
        Array.from(new Uint8Array(aliasedBlock.valueBeforeDecode)),
        [0x04, 0x03, 0x99, 0xbb, 0xcc],
        name
      );
      assert.deepStrictEqual(Array.from(new Uint8Array(aliasedBlock.valueBlock.valueHex)), [0x99, 0xbb, 0xcc], name);
      assert.strictEqual(aliasedBlock.valueBeforeDecodeView.buffer, aliasedInput.backing.buffer, name);
      assert.strictEqual(aliasedBlock.valueBlock.valueHexView.buffer, aliasedInput.backing.buffer, name);
    }
  });

  it("parses only the supplied subview and retains empty-input behavior", () => {
    for (const options of [{}, { copyInput: true }, { copyInput: false }]) {
      const backing = Uint8Array.of(0x05, 0x00, ...seed, 0x05, 0x00);
      const input = backing.subarray(2, 9);
      const result = fromBER(input, options);
      assert.strictEqual(result.offset, seed.length);
      assert.deepStrictEqual(Array.from((result.result as OctetString).valueBeforeDecodeView), seed);
      assert.strictEqual((result.result as OctetString).idBlock.tagNumber, 4);
      assert.deepStrictEqual(bytes(result.result as OctetString), seed);
    }

    const empty = fromBER(new ArrayBuffer(0), { copyInput: false });
    assert.strictEqual(empty.offset, -1);
    assert.strictEqual(empty.result.error, "Input buffer has zero length");
  });
});
