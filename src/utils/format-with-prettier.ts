import { Options, format } from "prettier";

export const formatWithPrettier = async (
  output: string,
  { fallbackConfig, parser, plugins, ...config }: Options & { fallbackConfig?: Options },
) => {
  try {
    return await format(output, { ...config, parser, plugins });
  } catch (e) {
    try {
      if (!fallbackConfig) return output;

      return await format(output, { parser, plugins, ...config, ...fallbackConfig });
    } catch (e) {
      return output;
    }
  }
};

export const nextJsPrettierConfig = {
  arrowParens: "avoid",
  printWidth: 120,
  tabWidth: 2,
  trailingComma: "all",
  importOrder: ["^react$", "^next/(.*)$", "<THIRD_PARTY_MODULES>", "^@heroicons/(.*)$", "^~~/(.*)$"],
  importOrderSortSpecifiers: true,
} as const;

export const hardhatPrettierConfig = {
  arrowParens: "avoid",
  printWidth: 120,
  tabWidth: 2,
  trailingComma: "all",
  overrides: [
    {
      files: "*.sol",
      options: {
        printWidth: 80,
        tabWidth: 4,
        useTabs: true,
        singleQuote: false,
        bracketSpacing: true,
        explicitTypes: "always",
      },
    },
  ],
} as const;
