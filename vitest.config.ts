import { defineConfig } from "vitest/config";

export default defineConfig({
  // Same class-field semantics as tsc and tsdown with "useDefineForClassFields": false.
  // Vite maps that tsconfig option only to setPublicClassFields, so class fields
  // without an initializer would still be emitted and reset values set by a base constructor.
  oxc: {
    assumptions: { setPublicClassFields: true },
    typescript: { removeClassFieldsWithoutInitializer: true },
  },
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*"],
      exclude: ["src/**/*.spec.ts", "build/**"],
    },
  },
});
