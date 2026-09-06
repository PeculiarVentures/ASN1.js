import * as assert from "assert";
import { describe, it } from "vitest";
import { Integer, Null, Sequence, fromBER } from "../src";
import { DEFAULT_MAX_CONTENT_LENGTH, createFromBerContext, localFromBER, registerFastParser } from "../src/parser";
import { typeStore } from "../src/TypeStore";
import { LocalIdentificationBlock } from "../src/internals/LocalIdentificationBlock";

function parse(input: number[], options = {}) {
  return fromBER(Uint8Array.from(input), options);
}

describe("short built-in parser path", () => {
  it("constructs the final built-in objects for short INTEGER, NULL, and SEQUENCE", () => {
    const integer = parse([0x02, 0x01, 0x7f]);
    assert.strictEqual(integer.offset, 3);
    assert.ok(integer.result instanceof Integer);
    assert.deepStrictEqual(Array.from((integer.result as Integer).valueBlock.valueHexView), [0x7f]);

    const emptyInteger = parse([0x02, 0x00]);
    assert.strictEqual(emptyInteger.offset, 2);
    assert.ok(emptyInteger.result instanceof Integer);

    const nullValue = parse([0x05, 0x00]);
    assert.strictEqual(nullValue.offset, 2);
    assert.ok(nullValue.result instanceof Null);

    const sequence = parse([0x30, 0x03, 0x02, 0x01, 0xff]);
    assert.strictEqual(sequence.offset, 5);
    assert.ok(sequence.result instanceof Sequence);
    assert.ok((sequence.result as Sequence).valueBlock.value[0] instanceof Integer);
  });

  it("preserves offsets, trailing input, malformed children, and limits", () => {
    const source = Uint8Array.of(0xaa, 0x02, 0x01, 0x7f, 0xbb);
    const offsetResult = localFromBER(source, 1, 3, createFromBerContext());
    assert.strictEqual(offsetResult.offset, 4);
    assert.deepStrictEqual(Array.from(offsetResult.result.valueBeforeDecodeView), [0x02, 0x01, 0x7f]);

    assert.strictEqual(parse([0x02, 0x01, 0x7f, 0xaa]).offset, 3);
    assert.strictEqual(parse([0x30, 0x03, 0x02, 0x02, 0x01]).offset, -1);

    const maxNodes0 = localFromBER(Uint8Array.of(0x02, 0x01, 0x7f), 0, 3, createFromBerContext({ maxNodes: 0 }));
    assert.strictEqual(maxNodes0.offset, -1);
    assert.strictEqual(maxNodes0.result.error, "Maximum ASN.1 node count exceeded");

    const maxNodes1Context = createFromBerContext({ maxNodes: 1 });
    const maxNodes1 = localFromBER(Uint8Array.of(0x02, 0x01, 0x7f), 0, 3, maxNodes1Context);
    assert.strictEqual(maxNodes1.offset, 3);
    assert.strictEqual(maxNodes1Context.nodesCount, 1);

    const maxNodes2Context = createFromBerContext({ maxNodes: 2 });
    const maxNodes2 = localFromBER(Uint8Array.of(0x30, 0x03, 0x02, 0x01, 0x7f), 0, 5, maxNodes2Context);
    assert.strictEqual(maxNodes2.offset, 5);
    assert.strictEqual(maxNodes2Context.nodesCount, 2);

    const contentLimited = localFromBER(
      Uint8Array.of(0x02, 0x01, 0x7f),
      0,
      3,
      createFromBerContext({ maxContentLength: 0 })
    );
    assert.strictEqual(contentLimited.offset, -1);
    assert.strictEqual(contentLimited.result.error, "Maximum ASN.1 content length exceeded");
    assert.strictEqual(DEFAULT_MAX_CONTENT_LENGTH > 0, true);
  });

  it("matches the generic parser result and context accounting", () => {
    const cases = [
      { name: "empty INTEGER", input: [0x02, 0x00] },
      { name: "signed INTEGER", input: [0x02, 0x01, 0x80] },
      { name: "empty NULL", input: [0x05, 0x00] },
      { name: "valid SEQUENCE", input: [0x30, 0x03, 0x02, 0x01, 0x7f] },
      { name: "truncated root value", input: [0x02, 0x02, 0x7f] },
      { name: "malformed child", input: [0x30, 0x03, 0x02, 0x02, 0x01] },
      { name: "trailing bytes", input: [0x02, 0x01, 0x7f, 0xaa] },
      { name: "maxNodes 0", input: [0x02, 0x01, 0x7f], options: { maxNodes: 0 } },
      { name: "maxNodes 1", input: [0x02, 0x01, 0x7f], options: { maxNodes: 1 } },
      { name: "maxNodes 2", input: [0x30, 0x03, 0x02, 0x01, 0x7f], options: { maxNodes: 2 } },
      { name: "maxContentLength 0", input: [0x02, 0x01, 0x7f], options: { maxContentLength: 0 } },
      { name: "maxContentLength 1", input: [0x02, 0x01, 0x7f], options: { maxContentLength: 1 } },
      { name: "maxContentLength 3", input: [0x30, 0x03, 0x02, 0x01, 0x7f], options: { maxContentLength: 3 } },
      { name: "maxDepth 0", input: [0x30, 0x03, 0x02, 0x01, 0x7f], options: { maxDepth: 0 } },
      { name: "maxDepth 1", input: [0x30, 0x03, 0x02, 0x01, 0x7f], options: { maxDepth: 1 } }
    ];

    const baseline = cases.map(({ input, options }) => {
      const bytes = Uint8Array.from(input);
      const context = createFromBerContext(options);
      return { result: localFromBER(bytes, 0, bytes.length, context), context };
    });

    const descriptor = Object.getOwnPropertyDescriptor(LocalIdentificationBlock.prototype, "fromBER");
    assert.ok(descriptor && "value" in descriptor);
    const original = descriptor.value as LocalIdentificationBlock["fromBER"];
    let calls = 0;
    Object.defineProperty(LocalIdentificationBlock.prototype, "fromBER", {
      ...descriptor,
      value: function (this: LocalIdentificationBlock, ...args: Parameters<LocalIdentificationBlock["fromBER"]>) {
        calls += 1;
        return Reflect.apply(original, this, args);
      }
    });
    try {
      cases.forEach(({ name, input, options }, index) => {
        const bytes = Uint8Array.from(input);
        const context = createFromBerContext(options);
        const result = localFromBER(bytes, 0, bytes.length, context);
        assert.deepStrictEqual(result, baseline[index].result, name);
        assert.deepStrictEqual(context, baseline[index].context, name);
      });
      assert.ok(calls > 0);
    } finally {
      Object.defineProperty(LocalIdentificationBlock.prototype, "fromBER", descriptor);
    }
  });

  it("falls back when the type store or header decoder is customized", () => {
    class CustomInteger extends Integer {
      public marker = true;
    }

    const typeDescriptor = Object.getOwnPropertyDescriptor(typeStore, "Integer");
    assert.ok(typeDescriptor && "value" in typeDescriptor);
    let typeReads = 0;
    Object.defineProperty(typeStore, "Integer", {
      configurable: typeDescriptor.configurable,
      enumerable: typeDescriptor.enumerable,
      get: () => {
        typeReads += 1;
        return CustomInteger;
      }
    });
    try {
      registerFastParser({ Integer, Null, Sequence });
      const result = parse([0x02, 0x01, 0x01]);
      assert.ok(result.result instanceof CustomInteger);
      assert.strictEqual((result.result as CustomInteger).marker, true);
      assert.strictEqual(typeReads, 1);
    } finally {
      Object.defineProperty(typeStore, "Integer", typeDescriptor);
      registerFastParser({ Integer, Null, Sequence });
    }

    const descriptor = Object.getOwnPropertyDescriptor(LocalIdentificationBlock.prototype, "fromBER");
    assert.ok(descriptor && "value" in descriptor);
    const original = descriptor.value as LocalIdentificationBlock["fromBER"];
    let calls = 0;
    Object.defineProperty(LocalIdentificationBlock.prototype, "fromBER", {
      ...descriptor,
      value: function (this: LocalIdentificationBlock, ...args: Parameters<LocalIdentificationBlock["fromBER"]>) {
        calls += 1;
        return Reflect.apply(original, this, args);
      }
    });
    try {
      registerFastParser({ Integer, Null, Sequence });
      const result = parse([0x02, 0x01, 0x01]);
      assert.ok(result.result instanceof Integer);
      assert.strictEqual(calls, 1);
    } finally {
      Object.defineProperty(LocalIdentificationBlock.prototype, "fromBER", descriptor);
      registerFastParser({ Integer, Null, Sequence });
    }
  });

  it("lets the existing child decoder enforce depth and malformed content", () => {
    const limited = parse([0x30, 0x03, 0x02, 0x01, 0x7f], { maxDepth: 0 });
    assert.strictEqual(limited.offset, -1);
    assert.strictEqual(limited.result.error, "Maximum ASN.1 nesting depth exceeded");
  });
});
