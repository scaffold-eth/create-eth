// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },
  {
    // Test files are excluded from tsconfig, and config/hook files are plain ESM,
    // so lint them without type-aware rules to avoid the "not in project" error.
    files: ["**/*.js", "**/*.mjs", "**/*.cjs", "**/*.test.ts"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    ignores: [".changeset", ".yarn", "bin", "dist", "templates", "externalExtensions"],
  },
  eslintPluginPrettierRecommended,
  {
    rules: {
      "prettier/prettier": ["warn", { endOfLine: "auto" }],
    },
  },
);
