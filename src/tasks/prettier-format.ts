import { execa } from "execa";

// Run the generated project's own `yarn format` so its prettier config and plugins
// (e.g. solidity) apply — the CLI's bundled prettier would use the wrong config.
export async function prettierFormat(targetDir: string) {
  try {
    await execa("yarn", ["format"], { cwd: targetDir });
  } catch (error) {
    throw new Error("Failed to format files", { cause: error });
  }

  return true;
}
