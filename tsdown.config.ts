import { readFileSync } from "node:fs";
import { defineConfig } from "tsdown";

const license = readFileSync("LICENSE", "utf8");
const banner = ["/*!", ...license.split("\n").map((line) => ` * ${line}`), " */"].join("\n");

export default defineConfig({
  entry: "src/index.ts",
  // ESM only. CommonJS consumers load it through require(esm) on Node ^20.19 / >=22.12.
  format: ["esm"],
  platform: "neutral",
  dts: true,
  clean: true,
  // One bundled module, as in v3: every type class registers itself in the
  // shared type store when its module runs, and index.ts registers the fast
  // encoder and parser. Unbundled output would let bundlers drop those modules
  // under "sideEffects": false.
  unbundle: false,
  // Keep .js/.d.ts output names (package.json is "type": "module")
  // instead of fixed .mjs/.d.mts extensions.
  fixedExtension: false,
  deps: {
    neverBundle: true,
  },
  exports: {
    legacy: true,
  },
  outputOptions: {
    // Drop TSDoc from the JS output; docs ship in the .d.ts files. Keep
    // @__PURE__ annotations so bundlers can tree-shake.
    comments: { legal: true, annotation: true, jsdoc: false },
  },
  banner,
  outDir: "build",
  tsconfig: "tsconfig.json",
  attw: {
    level: "error",
    profile: "esm-only",
  },
});
