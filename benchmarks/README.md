# DER parser benchmark

Build first, then run the paired benchmark from the repository root:

```sh
npm run build
node benchmarks/der.mjs
```

An optional module path compares current BER parsing with a previously built
baseline using the same dependencies and Node.js runtime:

```sh
node benchmarks/der.mjs /path/to/baseline/build/index.js
```

The benchmark uses the generated 1,993-byte certificate and 105,558-byte CRL in
`src/fixtures/strict-der/`. Both modes use `parseEmbedded: false`, `copyInput: false`,
`maxNodes: 100000`, and identical depth/content limits. Each mode is calibrated and
warmed up before nine paired rounds; mode order rotates each round. It reports
median milliseconds per parse and the median of the paired percentage changes.
A run takes approximately 15–25 seconds with a baseline, depending on calibration.

The performance target is DER within 10% of BER and BER within ordinary measurement
noise of the baseline. These measurements are descriptive rather than a flaky CI
threshold. Compare repeated runs on an idle machine with the same Node version,
fixtures, input ownership, embedded-value setting, and resource limits.

## Initial measurement

Measured on 2026-11-15 with Node.js v24.22.1 on macOS arm64. The baseline was
`b43208d`, after the BER repairs and before DER integration. These are results
from one nine-round run with the options above; percentage changes are medians
of paired samples, so they can differ from ratios of the separate time medians.

| Fixture                | BER median | DER median | DER vs BER | BER vs baseline |
| ---------------------- | ---------- | ---------- | ---------- | --------------- |
| 1,993-byte certificate | 0.0952 ms  | 0.1011 ms  | +6.41%     | +2.73%          |
| 105,558-byte CRL       | 19.7681 ms | 20.2568 ms | +1.50%     | +1.20%          |
