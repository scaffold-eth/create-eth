import arg from "arg";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { execa } from "execa";
import ncp from "ncp";

const ncpPromise = promisify(ncp.ncp);
const mkdirPromise = promisify(fs.mkdir);

const EXTERNAL_EXTENSIONS_DIR = "externalExtensions";

const TARGET_EXTENSION_DIR = "extension";

const parseArguments = (rawArgs: string[]) => {
  const args = arg({}, { argv: rawArgs.slice(2) });
  const projectPath = args._[0];
  if (!projectPath) {
    throw new Error("Project path is required");
  }
  return { projectPath };
};

const getChangedFiles = async (projectPath: string): Promise<string[]> => {
  const { stdout } = await execa("git", ["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"], {
    cwd: projectPath,
  });
  return stdout.split("\n").filter(Boolean);
};

const createDirectories = async (filePath: string, projectName: string) => {
  const dirPath = path.join(EXTERNAL_EXTENSIONS_DIR, projectName, TARGET_EXTENSION_DIR, path.dirname(filePath));
  await mkdirPromise(dirPath, { recursive: true });
};

const copyFiles = async (files: string[], projectName: string, projectPath: string) => {
  for (const file of files) {
    await createDirectories(file, projectName);
    const sourcePath = path.resolve(projectPath, file);
    const destPath = path.join(EXTERNAL_EXTENSIONS_DIR, projectName, TARGET_EXTENSION_DIR, file);
    await ncpPromise(sourcePath, destPath);
  }
};

const main = async (rawArgs: string[]) => {
  try {
    const { projectPath } = parseArguments(rawArgs);
    const projectName = path.basename(projectPath);

    console.log(`Project name is: ${projectName}`);
    console.log("Getting list of changed files...");

    const changedFiles = await getChangedFiles(projectPath);

    console.log("Changed files:", changedFiles);

    if (changedFiles.length === 0) {
      console.log("No changed files to copy.");
      return;
    }

    console.log("Copying changed files...");
    await copyFiles(changedFiles, projectName, projectPath);

    console.log("Files copied successfully.");
  } catch (err: any) {
    console.log(err);
    console.error("Error:", err.message);
  }
};

main(process.argv)
  .then(() => console.log("Done"))
  .catch(() => process.exit(1));
