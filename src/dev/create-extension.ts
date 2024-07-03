import arg from "arg";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { execa } from "execa";
import ncp from "ncp";
import { fileURLToPath } from "url";

const ncpPromise = promisify(ncp.ncp);
const mkdirPromise = promisify(fs.mkdir);

const EXTERNAL_EXTENSIONS_DIR = "externalExtensions";
const TARGET_EXTENSION_DIR = "extension";

const currentFileUrl = import.meta.url;
const templateDirectory = path.resolve(decodeURI(fileURLToPath(currentFileUrl)), "../../templates");

const parseArguments = (rawArgs: string[]) => {
  const args = arg({}, { argv: rawArgs.slice(2) });
  const projectPath = args._[0];
  if (!projectPath) {
    throw new Error("Project path is required");
  }
  return { projectPath };
};

const getFirstCommit = async (projectPath: string): Promise<string> => {
  const { stdout } = await execa("git", ["rev-list", "--max-parents=0", "HEAD"], {
    cwd: projectPath,
  });
  return stdout.trim();
};

const getChangedFilesFromFirstCommit = async (projectPath: string): Promise<string[]> => {
  const firstCommit = await getFirstCommit(projectPath);
  const { stdout } = await execa("git", ["diff", "--name-only", `${firstCommit}..HEAD`], {
    cwd: projectPath,
  });
  return stdout.split("\n").filter(Boolean);
};

const getChangedFiles = async (projectPath: string): Promise<string[]> => {
  return getChangedFilesFromFirstCommit(projectPath);
};

const createDirectories = async (filePath: string, projectName: string) => {
  const dirPath = path.join(EXTERNAL_EXTENSIONS_DIR, projectName, TARGET_EXTENSION_DIR, path.dirname(filePath));
  await mkdirPromise(dirPath, { recursive: true });
};

const findTemplateFiles = async (dir: string, templates: Set<string>) => {
  const files = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      await findTemplateFiles(fullPath, templates);
    } else if (file.name.endsWith(".template.mjs")) {
      let relativePath = path.relative(templateDirectory, fullPath).replace(/\.template\.mjs$/, "");

      // Normalize the relative path by stripping the initial parts
      if (relativePath.startsWith("base/")) {
        relativePath = relativePath.replace("base/", "");
      } else if (relativePath.startsWith("extensions/foundry/")) {
        relativePath = relativePath.replace("extensions/foundry/", "");
      } else if (relativePath.startsWith("extensions/hardhat/")) {
        relativePath = relativePath.replace("extensions/hardhat/", "");
      }

      templates.add(relativePath);
    }
  }
};

const copyFiles = async (files: string[], projectName: string, projectPath: string, templates: Set<string>) => {
  for (const file of files) {
    const sourcePath = path.resolve(projectPath, file);
    const destPath = path.join(EXTERNAL_EXTENSIONS_DIR, projectName, TARGET_EXTENSION_DIR, file);

    if (templates.has(file)) {
      console.log(`Skipping template file: ${sourcePath}`);
      console.log(`Please instead use ${destPath}.args.mjs`);
      continue;
    }

    await createDirectories(file, projectName);
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

    console.log("Finding template files...");
    const templates = new Set<string>();
    await findTemplateFiles(templateDirectory, templates);

    console.log("Copying changed files...");
    await copyFiles(changedFiles, projectName, projectPath, templates);

    console.log("Files copied successfully.");
  } catch (err: any) {
    console.log(err);
    console.error("Error:", err.message);
  }
};

main(process.argv)
  .then(() => console.log("Done"))
  .catch(() => process.exit(1));
