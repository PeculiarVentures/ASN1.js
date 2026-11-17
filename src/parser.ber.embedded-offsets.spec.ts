import * as assert from "assert";
import { describe, it } from "vitest";
import { BitString, Constructed, Integer, OctetString, Sequence, verifySchema } from "./index";
import { createFromBerContext, localFromBER, withHeuristic } from "./parser";

const kinds = [
  { name: "OCTET STRING", tag: 4, skipped: 0 },
  { name: "BIT STRING", tag: 3, skipped: 1 },
] as const;

function tlv(tag: number, content: Uint8Array): Uint8Array {
  return Uint8Array.of(tag, content.length, ...content);
}

function wrap(tag: number, content: Uint8Array): Uint8Array {
  return tlv(tag, tag === 3 ? Uint8Array.of(0, ...content) : content);
}

function syntheticSchema(tag: number): Sequence {
  // Traversing the detected child is supported by the existing schema matcher.
  const detected = new Constructed({ idBlock: { tagClass: 1, tagNumber: tag }, value: [new OctetString({ primitiveSchema: new Integer() })] });
  detected.idBlock.isConstructed = false;
  return new Sequence({ value: [detected] });
}

describe("BER embedded-value positions", () => {
  it.each(kinds)("locates nested $name children and the following sibling with nonzero input and base offsets", ({ tag, skipped }) => {
    const integer = Uint8Array.of(0x02, 0x01, 0x01);
    const input = tlv(0x30, Uint8Array.of(...wrap(tag, wrap(4, integer)), 0x02, 0x01, 0x07));
    const backing = Uint8Array.of(0xee, ...input, 0xdd);
    const context = createFromBerContext();
    context.positions = new WeakMap();
    context.baseOffset = 20;
    const decoded = localFromBER(backing, 1, input.length, context);
    assert.strictEqual(decoded.offset, input.length + 1);
    assert.ok(decoded.result instanceof Sequence);
    const [outer, sibling] = decoded.result.valueBlock.value;
    assert.ok(outer instanceof OctetString || outer instanceof BitString);
    const inner = outer.valueBlock.value[0];
    assert.ok(inner instanceof OctetString);
    const embedded = inner.valueBlock.value[0];
    assert.ok(embedded instanceof Integer);
    assert.deepStrictEqual(context.positions.get(outer), { tlvOffset: 23, contentOffset: 25, depth: 1 });
    assert.deepStrictEqual(context.positions.get(inner), { tlvOffset: 25 + skipped, contentOffset: 27 + skipped, depth: 2 });
    assert.deepStrictEqual(context.positions.get(embedded), { tlvOffset: 27 + skipped, contentOffset: 29 + skipped, depth: 3 });
    assert.deepStrictEqual(context.positions.get(sibling), { tlvOffset: 30 + skipped, contentOffset: 32 + skipped, depth: 1 });
    assert.strictEqual(context.baseOffset, 20);
    assert.strictEqual(context.depth, 0);
    assert.strictEqual(context.node, undefined);
    assert.strictEqual(context.nodesCount, 5);
    assert.strictEqual(context.heuristic, undefined);
    assert.strictEqual(embedded.valueBlock.valueHexView.buffer, backing.buffer);
    assert.deepStrictEqual(new Uint8Array(decoded.result.toBER()), input);
  });

  it.each(kinds)("uses root-relative $name diagnostic offsets through verifySchema and exact input views", ({ tag, skipped }) => {
    const input = tlv(0x30, wrap(tag, Uint8Array.of(0x04, 0x05, 0x02, 0x01, 0x01, 0xde, 0xad)));
    const expectedOffset = 9 + skipped;
    for (const copyInput of [true, false]) {
      for (const dataView of [false, true]) {
        const backing = Uint8Array.of(0xee, 0xff, ...input, 0xdd);
        const view = dataView ? new DataView(backing.buffer, 2, input.length) : backing.subarray(2, 2 + input.length);
        const checked = verifySchema(view, syntheticSchema(tag), { encodingRules: "BER", requireFullInput: true, parseEmbedded: true, copyInput });
        assert.strictEqual(checked.verified, false);
        if (checked.verified) continue;
        assert.strictEqual(checked.diagnostic?.code, "TRAILING_DATA");
        assert.strictEqual(checked.diagnostic?.offset, expectedOffset);
        assert.strictEqual(checked.diagnostic?.depth, 3);
        assert.ok(checked.result instanceof Integer);
        assert.strictEqual(checked.result.valueBlock.valueHexView.buffer === backing.buffer, !copyInput);
        backing[2 + expectedOffset - 1] = 0x02;
        assert.strictEqual(checked.result.valueBlock.valueHexView[0], copyInput ? 1 : 2);
        assert.strictEqual(checked.result.valueBlock.valueDec, 1);
      }
    }
  });

  it.each(kinds)("restores the base offset after successful, partial, failed and throwing $name heuristics", ({ tag }) => {
    const attempts = [
      { content: Uint8Array.of(0x02, 0x01, 0x01), retained: 1 },
      { content: Uint8Array.of(0x02, 0x01, 0x01, 0xff), retained: 0 },
      { content: Uint8Array.of(0x02, 0x02, 0x01), retained: 0 },
      {
        content: tlv(
          0x18,
          Uint8Array.from("invalid", (character) => character.charCodeAt(0)),
        ),
        retained: 0,
      },
    ];
    for (const { content, retained } of attempts) {
      const wrapped = wrap(tag, content);
      const input = tlv(0x30, Uint8Array.of(...wrapped, 0x02, 0x01, 0x07));
      const context = createFromBerContext();
      context.positions = new WeakMap();
      context.baseOffset = 29;
      const decoded = localFromBER(input, 0, input.length, context);
      assert.strictEqual(decoded.offset, input.length);
      assert.strictEqual(decoded.result.error, "");
      assert.ok(decoded.result instanceof Sequence);
      const [outer, sibling] = decoded.result.valueBlock.value;
      assert.ok(outer instanceof OctetString || outer instanceof BitString);
      assert.strictEqual(outer.valueBlock.value.length, retained);
      assert.deepStrictEqual(context.positions.get(sibling), { tlvOffset: 31 + wrapped.length, contentOffset: 33 + wrapped.length, depth: 1 });
      assert.strictEqual(context.baseOffset, 29);
      assert.strictEqual(context.nodesCount, 4);
      assert.strictEqual(context.depth, 0);
      assert.strictEqual(context.node, undefined);
      assert.strictEqual(context.resourceLimitExceeded, undefined);
      assert.strictEqual(context.heuristic, undefined);
      assert.deepStrictEqual(new Uint8Array(decoded.result.toBER()), input);
    }
  });

  it.each(kinds)("keeps a later mandatory diagnostic positioned after the $name heuristic", ({ tag }) => {
    const first = wrap(tag, Uint8Array.of(0x02, 0x01, 0x01));
    const input = tlv(0x30, Uint8Array.of(...first, 0x04, 0x04, 0x02, 0x01, 0x01, 0xff));
    const schema = new Sequence({ value: [tag === 4 ? new OctetString() : new BitString(), new OctetString({ primitiveSchema: new Integer() })] });
    const checked = verifySchema(input, schema, { requireFullInput: true, parseEmbedded: true });
    assert.strictEqual(checked.verified, false);
    if (!checked.verified) {
      assert.strictEqual(checked.diagnostic?.code, "TRAILING_DATA");
      assert.strictEqual(checked.diagnostic?.offset, input.length - 1);
      assert.strictEqual(checked.diagnostic?.depth, 2);
    }
  });

  it.each(kinds)("locates $name heuristic children in direct decoders without a current node", ({ tag, skipped }) => {
    const content = Uint8Array.of(...(skipped ? [0] : []), 0x02, 0x01, 0x01);
    const backing = Uint8Array.of(0xee, 0xff, ...content, 0xdd);
    const block = tag === 4 ? new OctetString({ lenBlock: { length: content.length } }) : new BitString({ lenBlock: { length: content.length } });
    const context = createFromBerContext();
    context.positions = new WeakMap();
    context.baseOffset = 31;
    assert.strictEqual(block.fromBER(backing, 2, content.length, context), content.length + 2);
    const embedded = block.valueBlock.value[0];
    assert.ok(embedded instanceof Integer);
    assert.deepStrictEqual(context.positions.get(embedded), { tlvOffset: 33 + skipped, contentOffset: 35 + skipped, depth: 1 });
    assert.strictEqual(context.baseOffset, 31);
  });

  it("restores an absent or existing BER base offset even when the heuristic callback throws", () => {
    const failure = new Error("interrupted heuristic");
    for (const baseOffset of [undefined, 17]) {
      const context = createFromBerContext();
      context.baseOffset = baseOffset;
      assert.throws(
        () =>
          withHeuristic(context, () => {
            context.baseOffset = 41;
            localFromBER(Uint8Array.of(0x02, 0x01, 0x01), 0, 3, context);
            throw failure;
          }),
        (error) => error === failure,
      );
      assert.strictEqual(context.baseOffset, baseOffset);
      assert.strictEqual(context.nodesCount, 1);
      assert.strictEqual(context.depth, 0);
      assert.strictEqual(context.node, undefined);
      assert.strictEqual(context.heuristic, undefined);
    }
  });
});
