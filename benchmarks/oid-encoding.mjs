// Requires Node.js >=24.5 (native TypeScript imports) and `npm run build`.
// Run: node --expose-gc benchmarks/oid-encoding.mjs [baseline-build-entry]
// The optional baseline entry is a built index.js/.mjs from another checkout.
// Packing uses a pre-parsed BigInt; construction includes decimal parsing.
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { uint } from "@peculiar/utils";
import { encodeBase128 } from "../src/internals/integerUtils.ts";
import * as current from "../build/index.js";

const baseline = process.argv[2] ? await import(pathToFileURL(resolve(process.argv[2])).href) : undefined;
const samples = 5;
let sink;

function medianMilliseconds(action) {
  for (let i = 0; i < 2; i++) sink = action();
  const times = [];
  for (let i = 0; i < samples; i++) {
    globalThis.gc?.();
    const start = performance.now();
    sink = action();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  return Number(times[Math.floor(times.length / 2)].toFixed(3));
}

console.log(JSON.stringify({ node: process.version, platform: process.platform, arch: process.arch, samples, unit: "milliseconds (median)", baseline: process.argv[2] ?? null }));
for (const digits of [10000, 30000, 100000, 300000]) {
  const decimal = "9".repeat(digits);
  const value = BigInt(decimal);
  const absolute = `2.25.${decimal}`;
  const absoluteOid = new current.ObjectIdentifier();
  const relativeOid = new current.RelativeObjectIdentifier();
  assert.deepEqual(encodeBase128(value), uint.encode(value, { bitsPerByte: 7 }));
  if (baseline) {
    for (const [Current, Baseline, input] of [
      [current.ObjectIdentifier, baseline.ObjectIdentifier, absolute],
      [current.RelativeObjectIdentifier, baseline.RelativeObjectIdentifier, decimal],
    ]) {
      assert.deepEqual(new Current({ value: input }).toBER(), new Baseline({ value: input }).toBER());
    }
  }

  const result = {
    digits,
    decimalToBigInt: medianMilliseconds(() => BigInt(decimal)),
    legacyPacking: medianMilliseconds(() => uint.encode(value, { bitsPerByte: 7 })),
    currentPacking: medianMilliseconds(() => encodeBase128(value)),
    absoluteAssignment: medianMilliseconds(() => {
      absoluteOid.setValue(absolute);
      return absoluteOid;
    }),
    relativeAssignment: medianMilliseconds(() => {
      relativeOid.setValue(decimal);
      return relativeOid;
    }),
    absoluteConstruction: medianMilliseconds(() => new current.ObjectIdentifier({ value: absolute })),
    relativeConstruction: medianMilliseconds(() => new current.RelativeObjectIdentifier({ value: decimal })),
  };
  if (baseline) {
    const baselineAbsoluteOid = new baseline.ObjectIdentifier();
    const baselineRelativeOid = new baseline.RelativeObjectIdentifier();
    result.baselineAbsoluteAssignment = medianMilliseconds(() => {
      baselineAbsoluteOid.setValue(absolute);
      return baselineAbsoluteOid;
    });
    result.baselineRelativeAssignment = medianMilliseconds(() => {
      baselineRelativeOid.setValue(decimal);
      return baselineRelativeOid;
    });
    result.baselineAbsoluteConstruction = medianMilliseconds(() => new baseline.ObjectIdentifier({ value: absolute }));
    result.baselineRelativeConstruction = medianMilliseconds(() => new baseline.RelativeObjectIdentifier({ value: decimal }));
  }
  result.packedDigits = encodeBase128(value).length;
  console.log(JSON.stringify(result));
}
assert.ok(sink);
