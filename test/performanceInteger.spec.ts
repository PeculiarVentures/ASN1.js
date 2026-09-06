import * as assert from "assert";
import { runInNewContext } from "node:vm";
import { test, vi } from "vitest";
import { Integer } from "../src";
import { LocalIntegerValueBlock } from "../src/internals/LocalIntegerValueBlock";
import { powers2 } from "../src/internals/constants";
import { bytesToSignedDecimal } from "../src/internals/integerUtils";

function integerFromHex(valueHex: number[]): Integer {
  return new Integer({ valueHex: Uint8Array.from(valueHex) });
}

function fallbackDecimal(view: Uint8Array): string {
  return runInNewContext(`(${bytesToSignedDecimal.toString()})(input)`, { BigInt: undefined, input: view });
}

test("native INTEGER conversion handles fixed signed encodings", () => {
  const cases: [number[], bigint][] = [
    [[], BigInt(0)],
    [[0x00], BigInt(0)],
    [[0x01], BigInt(1)],
    [[0x7f], BigInt(127)],
    [[0x00, 0x7f], BigInt(127)],
    [[0x00, 0x80], BigInt(128)],
    [[0x00, 0xff], BigInt(255)],
    [[0x01, 0x00], BigInt(256)],
    [[0x80], BigInt(-128)],
    [[0x81], BigInt(-127)],
    [[0xff], BigInt(-1)],
    [[0xff, 0x01], BigInt(-255)],
    [[0xff, 0x80], BigInt(-128)],
    [[0xff, 0x00], BigInt(-256)],
    [[0xff, 0xff], BigInt(-1)]
  ];

  for (const [valueHex, expected] of cases) {
    const integer = integerFromHex(valueHex);

    assert.strictEqual(integer.toBigInt(), expected);
    assert.strictEqual(integer.valueBlock.toString(), expected.toString(10));
  }
});

test("native INTEGER conversion reads a nonzero-offset valueHexView", () => {
  const source = Uint8Array.of(0xaa, 0x00, 0x80, 0xbb);
  const integer = new Integer({ valueHex: source.subarray(1, 3) });

  assert.strictEqual(integer.toBigInt(), BigInt(128));
  assert.strictEqual(integer.valueBlock.toString(), "128");
});

test("native INTEGER conversion handles large positive and negative values", () => {
  const before = powers2.length;

  for (const bits of [2048, 8192]) {
    const magnitude = (BigInt(1) << BigInt(bits - 1)) + BigInt(123456789);

    for (const expected of [magnitude, -magnitude]) {
      const integer = Integer.fromBigInt(expected);

      assert.strictEqual(integer.toBigInt(), expected);
      assert.strictEqual(integer.valueBlock.toString(), expected.toString(10));
    }
  }

  assert.strictEqual(powers2.length, before);
});

test("native INTEGER conversion does not grow the decimal powers table", () => {
  const integer = integerFromHex([0x00, 0x80]);
  const before = powers2.length;

  for (let i = 0; i < 3; i++) {
    assert.strictEqual(integer.toBigInt(), BigInt(128));
    assert.strictEqual(integer.valueBlock.toString(), "128");
  }

  assert.strictEqual(powers2.length, before);
});

test("BigInt-free INTEGER conversion matches native conversion", () => {
  const fixed = [[], [0x00], [0x7f], [0x00, 0x80], [0xff], [0xff, 0x80], [0xff, 0x00]];

  for (const valueHex of fixed) {
    const integer = integerFromHex(valueHex);

    assert.strictEqual(fallbackDecimal(integer.valueBlock.valueHexView), integer.valueBlock.toString());
  }

  const offsetSource = Uint8Array.of(0xaa, 0xff, 0x00, 0xbb);
  const offsetView = offsetSource.subarray(1, 3);
  assert.strictEqual(fallbackDecimal(offsetView), "-256");

  const iteratorView = Uint8Array.of(0x01, 0x02);
  Object.defineProperty(iteratorView, Symbol.iterator, {
    configurable: true,
    value() {
      throw new Error("custom iterator was used");
    }
  });
  assert.strictEqual(fallbackDecimal(iteratorView), "258");

  for (const bits of [2048, 8192]) {
    const magnitude = (BigInt(1) << BigInt(bits - 1)) + BigInt(123456789);
    for (const expected of [magnitude, -magnitude]) {
      const integer = Integer.fromBigInt(expected);

      assert.strictEqual(fallbackDecimal(integer.valueBlock.valueHexView), expected.toString(10));
    }
  }
});

test("BigInt-free INTEGER conversion handles seeded byte arrays and repeats", () => {
  let seed = 0x51a7ed;
  const before = powers2.length;
  const next = () => {
    seed = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    seed = (seed + 0x6d2b79f5) | 0;

    return seed >>> 0;
  };

  for (let count = 0; count < 100; count++) {
    const length = (next() % 128) + 1;
    const view = new Uint8Array(length + 11);
    for (let i = 0; i < view.length; i++) view[i] = next() & 0xff;
    const value = view.subarray(11);
    const expected = fallbackDecimal(value);

    assert.strictEqual(expected, fallbackDecimal(value));
    assert.strictEqual(expected, integerFromHex(Array.from(value)).valueBlock.toString());
  }

  assert.strictEqual(powers2.length, before);
});

test("toBigInt respects own and prototype toString overrides", () => {
  const integer = integerFromHex([0x2a]);
  const valueBlock = integer.valueBlock;
  const originalPrototypeToString = LocalIntegerValueBlock.prototype.toString;
  let ownCalls = 0;

  try {
    const ownToString = function (this: LocalIntegerValueBlock): string {
      ownCalls++;
      assert.strictEqual(this, valueBlock);

      return "41";
    };
    Object.defineProperty(ownToString, "call", {
      configurable: true,
      value() {
        throw new Error("custom function call property was used");
      }
    });
    valueBlock.toString = ownToString;
    assert.strictEqual(integer.toBigInt(), BigInt(41));
    assert.strictEqual(ownCalls, 1);

    delete (valueBlock as unknown as { toString?: unknown }).toString;
    LocalIntegerValueBlock.prototype.toString = function (this: LocalIntegerValueBlock): string {
      assert.strictEqual(this, valueBlock);

      return "44";
    };
    assert.strictEqual(integer.toBigInt(), BigInt(44));
  } finally {
    delete (valueBlock as unknown as { toString?: unknown }).toString;
    LocalIntegerValueBlock.prototype.toString = originalPrototypeToString;
  }

  assert.strictEqual(integer.toBigInt(), BigInt(42));
});

test("toBigInt reads a toString getter once with the value block as this", () => {
  const integer = integerFromHex([0x2a]);
  const valueBlock = integer.valueBlock;
  const original = Object.getOwnPropertyDescriptor(valueBlock, "toString");
  let getterCalls = 0;

  try {
    Object.defineProperty(valueBlock, "toString", {
      configurable: true,
      get(this: LocalIntegerValueBlock) {
        getterCalls++;
        assert.strictEqual(this, valueBlock);

        return function (this: LocalIntegerValueBlock): string {
          assert.strictEqual(this, valueBlock);

          return "43";
        };
      }
    });
    assert.strictEqual(integer.toBigInt(), BigInt(43));
    assert.strictEqual(getterCalls, 1);
  } finally {
    if (original) Object.defineProperty(valueBlock, "toString", original);
    else delete (valueBlock as unknown as { toString?: unknown }).toString;
  }
});

test("captures the original value-block serializer before Integer initializes", async () => {
  vi.resetModules();
  const isolatedLocal = await vi.importActual<typeof import("../src/internals/LocalIntegerValueBlock")>(
    "../src/internals/LocalIntegerValueBlock"
  );
  const isolatedInteger = isolatedLocal.LocalIntegerValueBlock;
  const descriptor = Object.getOwnPropertyDescriptor(isolatedInteger.prototype, "toString");
  assert.ok(descriptor && "value" in descriptor);
  let calls = 0;

  Object.defineProperty(isolatedInteger.prototype, "toString", {
    ...descriptor,
    value: function (): string {
      calls += 1;

      return "12345678901234567890";
    }
  });
  try {
    const { Integer: IsolatedInteger } = await vi.importActual<typeof import("../src/Integer")>("../src/Integer");
    const integer = new IsolatedInteger({ valueHex: Uint8Array.of(0x2a) });
    assert.strictEqual(integer.toBigInt(), BigInt("12345678901234567890"));
    assert.strictEqual(calls, 1);
  } finally {
    Object.defineProperty(isolatedInteger.prototype, "toString", descriptor);
    vi.resetModules();
  }
});
