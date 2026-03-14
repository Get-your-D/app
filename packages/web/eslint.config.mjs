import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import eslint from '@eslint/js';
import react from "../web-shared/eslint/react.mjs";
import reactHooks from 'eslint-plugin-react-hooks';


const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "complexity": ["warn", { "max": 10 }],
      "default-case": "warn",
      "eqeqeq": "error",
      "no-empty-function": "warn",
      "no-return-await": "warn",
      "no-script-url": "error",
      "no-self-compare": "error",
      "no-throw-literal": "warn",
      "no-unmodified-loop-condition": "error",
      "no-unused-expressions": "warn",
      "no-useless-return": "warn",
      "require-await": "warn",
      "no-use-before-define": "error",
      "camelcase": "warn",
      "max-depth": ["warn", { "max": 3 }],
      "max-lines": ["warn", { "max": 300, "skipBlankLines": true, "skipComments": true }],
      "max-nested-callbacks": "warn",
      "max-params": ["warn", { "max": 3 }],
      "max-statements": ["warn", { "max": 10 }],
      "no-lonely-if": "warn",
      "no-multiple-empty-lines": ["warn", { "max": 1, "maxEOF": 1, "maxBOF": 0 }],
    }
  },
  ...react,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  eslintConfigPrettier,
]);

export default eslintConfig;
