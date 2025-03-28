import tseslint from "typescript-eslint";
import baseConfig from "@peculiar/eslint-config-base";

export default tseslint.config([
  ...baseConfig,
  {
    ignores: [
      "build/**/*",
      "website/**/*",
      "eslint.config.mjs",
      "node_modules/**/*",
    ],
  },
  {
    rules: {
      "@stylistic/quotes": ["error", "double"],
      "@stylistic/padding-line-between-statements": "off",
      "@stylistic/max-len": ["error", { code: 120 }],
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
      }],
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-prototype-builtins": "off",
      "@typescript-eslint/prefer-for-of": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-dynamic-delete": "off",
      "@typescript-eslint/no-unsafe-declaration-merging": "off"
    }
  },
]);
