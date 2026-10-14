import fs from "fs";
import path from "path";

export async function createProjectDirectory(projectName: string) {
  const resolvedPath = path.resolve(projectName);

  if (fs.existsSync(resolvedPath)) {
    const files = fs.readdirSync(resolvedPath);
    if (files.length > 0) {
      throw new Error(`Directory ${resolvedPath} is not empty`);
    }
    return true;
  }

  try {
    await fs.promises.mkdir(resolvedPath, { recursive: true });
  } catch (error) {
    throw new Error("Failed to create directory", { cause: error });
  }

  return true;
}
