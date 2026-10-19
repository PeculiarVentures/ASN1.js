import * as assert from "assert";
import { test, vi } from "vitest";
import { Integer } from "../index";
import { LocalIntegerValueBlock } from "./LocalIntegerValueBlock";

function integerFromHex(valueHex: number[]): Integer {
  return new Integer({ valueHex: Uint8Array.from(valueHex) });
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
    [[0xff, 0xff], BigInt(-1)],
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
  for (const bits of [2048, 8192]) {
    const magnitude = (BigInt(1) << BigInt(bits - 1)) + BigInt(123456789);

    for (const expected of [magnitude, -magnitude]) {
      const integer = Integer.fromBigInt(expected);

      assert.strictEqual(integer.toBigInt(), expected);
      assert.strictEqual(integer.valueBlock.toString(), expected.toString(10));
    }
  }
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
      },
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
      },
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
  const isolatedLocal = await vi.importActual<typeof import("./LocalIntegerValueBlock")>("./LocalIntegerValueBlock");
  const isolatedInteger = isolatedLocal.LocalIntegerValueBlock;
  const descriptor = Object.getOwnPropertyDescriptor(isolatedInteger.prototype, "toString");
  assert.ok(descriptor && "value" in descriptor);
  let calls = 0;

  Object.defineProperty(isolatedInteger.prototype, "toString", {
    ...descriptor,
    value: function (): string {
      calls += 1;

      return "12345678901234567890";
    },
  });
  try {
    const { Integer: IsolatedInteger } = await vi.importActual<typeof import("../Integer")>("../Integer");
    const integer = new IsolatedInteger({ valueHex: Uint8Array.of(0x2a) });
    assert.strictEqual(integer.toBigInt(), BigInt("12345678901234567890"));
    assert.strictEqual(calls, 1);
  } finally {
    Object.defineProperty(isolatedInteger.prototype, "toString", descriptor);
    vi.resetModules();
  }
});
