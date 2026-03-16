import { defineConfig, globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import eslint from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import react from "./react.mjs";
import { commonRules } from "./common-rules.mjs";

/**
 * @param {string} dirname - pass `import.meta.dirname` from the consuming package
 * @param {import("eslint").Linter.Config[]} nextConfigs - Next.js-specific configs
 *   (e.g. [...nextVitals, ...nextTs]) imported from the consuming package's node_modules
 */
export default function nextAppConfig(dirname, nextConfigs = []) {
  return defineConfig([
    ...nextConfigs,
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked.map((config) => ({
      ...config,
      files: ["**/*.{ts,tsx}"],
    })),
    reactHooks.configs.flat.recommended,
    {
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
        parserOptions: {
          project: true,
          tsconfigRootDir: dirname,
        },
      },
      rules: commonRules,
    },
    ...react,
    globalIgnores([
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ]),
    eslintConfigPrettier,
  ]);
}
