// @ts-check
import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      "prettier/prettier": ["error", { endOfLine: "auto" }],
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
    },
  },
  eslintConfigPrettier,
);
