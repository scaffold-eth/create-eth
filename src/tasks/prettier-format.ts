import { execa } from "execa";

// TODO: Instead of using execa, use prettier package from cli to format targetDir
export async function prettierFormat(targetDir: string) {
  try {
    await execa("yarn", ["format"], { cwd: targetDir });
  } catch (error) {
    throw new Error("Failed to format files", { cause: error });
  }

  return true;
}
