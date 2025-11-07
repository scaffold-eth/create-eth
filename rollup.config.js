import typescript from "@rollup/plugin-typescript";
import autoExternal from "rollup-plugin-auto-external";
import json from "@rollup/plugin-json";

export default [
  {
    input: "src/cli.ts",
    output: {
      dir: "dist",
      format: "es",
      sourcemap: true,
    },
    plugins: [autoExternal(), typescript({ exclude: ["templates/**", "externalExtensions/**"] }), json()],
  },
  {
    input: "src/extensions/generate-extension-json.ts",
    output: {
      file: "dist/generate-extensions.js",
      format: "es",
      sourcemap: true,
    },
    plugins: [autoExternal(), typescript({ exclude: ["templates/**", "externalExtensions/**"] }), json()],
  },
];
