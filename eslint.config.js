import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import boundaries from "eslint-plugin-boundaries";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["vite.config.ts"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      prettier,
    ],
    plugins: {
      import: importPlugin,
      "unused-imports": unusedImports,
      boundaries,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        sourceType: "module",
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      boundaries: {
        defaultMessage: "Arquivo fora do local permitido",
        elementTypes: ["component", "hook"],
        paths: [
          {
            type: "component",
            pattern: "src/components/*",
          },
          {
            type: "hook",
            pattern: "src/hooks/*",
          },
        ],
      },
    },
    rules: {
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],

      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "variable",
          modifiers: ["const"],
          types: ["function"],
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
          filter: { regex: "^use[A-Z]", match: false },
        },
        {
          selector: "function",
          format: ["PascalCase"],
          filter: { regex: "^[A-Z]", match: true },
        },
        {
          selector: "function",
          format: ["camelCase"],
          filter: { regex: "^use[A-Z].*$", match: true },
        },
        {
          selector: "function",
          format: ["camelCase"],
          filter: { regex: "^[a-z]", match: true },
        },
      ],
      "boundaries/element-types": "error",
      "boundaries/no-extraneous-dependencies": "off",
      "boundaries/no-unknown-files": "off",
      "import/no-default-export": "warn",
    },
  },
]);
