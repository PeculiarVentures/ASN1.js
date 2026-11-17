import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fromBER } from "../build/index.js";

const sampleMilliseconds = 250;
const warmupMilliseconds = 500;
const rounds = 9;
const options = { parseEmbedded: false, copyInput: false, maxDepth: 100, maxNodes: 100000, maxContentLength: 16 * 1024 * 1024 };
const modes = [
  { name: "BER", parse: fromBER, options },
  { name: "DER", parse: fromBER, options: { ...options, encodingRules: "DER" } },
];
if (process.argv[2]) {
  const baseline = await import(pathToFileURL(resolve(process.argv[2])).href);
  modes.push({ name: "baseline BER", parse: baseline.fromBER, options });
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

function batch(mode, input, iterations) {
  const started = performance.now();
  for (let i = 0; i < iterations; i++) {
    const parsed = mode.parse(input, mode.options);
    if (parsed.offset !== input.length) throw new Error(`${mode.name} failed: ${parsed.result.error}`);
  }
  return performance.now() - started;
}

function calibrate(mode, input) {
  let iterations = 1;
  let duration;
  do {
    duration = batch(mode, input, iterations);
    if (duration < 50) iterations *= 2;
  } while (duration < 50);
  return Math.max(1, Math.round((sampleMilliseconds / duration) * iterations));
}

console.log(`Node ${process.version}; ${rounds} paired rounds; ${sampleMilliseconds} ms target per sample; options ${JSON.stringify(options)}`);
for (const fixture of ["legacy-ca.der", "revoked.crl.der"]) {
  const input = readFileSync(new URL(`../src/fixtures/strict-der/${fixture}`, import.meta.url));
  const iterations = modes.map((mode) => calibrate(mode, input));
  const timings = modes.map(() => []);
  for (let i = 0; i < modes.length; i++) {
    const started = performance.now();
    while (performance.now() - started < warmupMilliseconds) batch(modes[i], input, iterations[i]);
  }

  // Rotate order within each round to reduce a consistent thermal/GC advantage.
  for (let round = 0; round < rounds; round++) {
    for (let step = 0; step < modes.length; step++) {
      const index = (round + step) % modes.length;
      timings[index].push(batch(modes[index], input, iterations[index]) / iterations[index]);
    }
  }

  console.log(`\n${fixture}: ${input.length} bytes`);
  console.table(modes.map((mode, index) => ({ mode: mode.name, "median ms/parse": median(timings[index]).toFixed(4), "iterations/sample": iterations[index] })));
  const derOverhead = median(timings[1].map((time, index) => time / timings[0][index] - 1));
  console.log(`Paired median DER overhead vs BER: ${(derOverhead * 100).toFixed(2)}% (target <= 10%)`);
  if (modes.length === 3) {
    const berChange = median(timings[0].map((time, index) => time / timings[2][index] - 1));
    console.log(`Paired median BER change vs baseline: ${(berChange * 100).toFixed(2)}%`);
  }
}
