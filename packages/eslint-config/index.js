// Shared flat ESLint config (ESLint 9). Consume from a package's eslint.config.js:
//
//   import base from "@buddy-line/eslint-config";
//   export default [...base, { /* package overrides */ }];
//
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist/**", ".next/**", "coverage/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/consistent-type-imports": "error"
    }
  },
  prettier
);
