import js from "@eslint/js";
import globals from "globals";
import sveltePlugin from "eslint-plugin-svelte";
import tseslint from "typescript-eslint";
import svelteParser from "svelte-eslint-parser";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...sveltePlugin.configs["flat/recommended"],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parser: svelteParser,
      parserOptions: { parser: tseslint.parser },
    },
  },
  {
    rules: {
      "svelte/no-navigation-without-resolve": "off",
    },
  },
  {
    ignores: [".svelte-kit/", "dist/", ".wrangler/"],
  },
);
