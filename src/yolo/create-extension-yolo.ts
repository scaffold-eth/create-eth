import arg from "arg";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { execa } from "execa";
import ncp from "ncp";
import chalk from "chalk";
import { Args } from "../types";

const EXTERNAL_EXTENSIONS_DIR = "externalExtensions";
const TARGET_EXTENSION_DIR = "extension";
const DELETED_FILES_LOG = "deletedFiles.log";
const COMMIT_HASH_LOG = "commitHash.log";

const prettyLog = {
  info: (message: string, indent = 0) => console.log(chalk.cyan(`${"  ".repeat(indent)}${message}`)),
  success: (message: string, indent = 0) => console.log(chalk.green(`${"  ".repeat(indent)}✔︎ ${message}`)),
  warning: (message: string, indent = 0) => console.log(chalk.yellow(`${"  ".repeat(indent)}⚠ ${message}`)),
  error: (message: string, indent = 0) => console.log(chalk.red(`${"  ".repeat(indent)}✖ ${message}`)),
};

const ncpPromise = promisify(ncp);

const getProjectPathAndCommitHash = (rawArgs: string[]) => {
  const args = arg({}, { argv: rawArgs.slice(2) });
  const projectPath = args._[0];
  const commitHash = args._[1];
  if (!projectPath || !commitHash) {
    throw new Error("Project path and commit hash are required");
  }
  return { projectPath, commitHash };
};

const getDeletedAndRenamedFilesSinceCommit = async (projectPath: string, commitHash: string): Promise<string[]> => {
  const { stdout: gitOutput } = await execa(
    "git",
    ["diff", "--diff-filter=DR", "--name-status", `${commitHash}..HEAD`],
    { cwd: projectPath },
  );

  // Process the output to extract deleted and renamed files
  const deletedAndRenamedFiles = gitOutput
    .split("\n") // Split into lines
    .filter(Boolean) // Remove empty lines
    .map(line => {
      const parts = line.split("\t");
      if (line.startsWith("D")) {
        return parts[1]; // For deleted files, return the file name
      } else if (line.startsWith("R")) {
        return parts[1]; // For renamed files, return the original file name
      }
      return null; // Ignore other cases
    })
    .filter(Boolean); // Remove null entries

  return deletedAndRenamedFiles as string[];
};

const getChangedFilesSinceCommit = async (projectPath: string, commitHash: string): Promise<string[]> => {
  const { stdout } = await execa("git", ["diff", "--diff-filter=d", "--name-only", `${commitHash}..HEAD`], {
    cwd: projectPath,
  });

  return stdout.split("\n").filter(Boolean);
};

const createDirectories = async (filePath: string, projectName: string) => {
  const dirPath = path.join(EXTERNAL_EXTENSIONS_DIR, projectName, TARGET_EXTENSION_DIR, path.dirname(filePath));
  await fs.promises.mkdir(dirPath, { recursive: true });
};

const copyChangedFiles = async (changedFiles: string[], projectName: string, projectPath: string) => {
  for (const file of changedFiles) {
    const sourcePath = path.resolve(projectPath, file);
    const destPath = path.join(EXTERNAL_EXTENSIONS_DIR, projectName, TARGET_EXTENSION_DIR, file);
    if (!fs.existsSync(sourcePath)) continue;
    await createDirectories(file, projectName);
    await ncpPromise(sourcePath, destPath);
    prettyLog.success(`Copied changed file: ${file}`, 2);
  }
};

const logCommitHash = async (commitHash: string, projectPath: string) => {
  const logPath = path.join(EXTERNAL_EXTENSIONS_DIR, projectPath, TARGET_EXTENSION_DIR, COMMIT_HASH_LOG);
  await fs.promises.writeFile(logPath, commitHash, "utf8");
  prettyLog.success(`Commit hash logged to ${logPath}\n`, 1);
};

const logDeletedFiles = async (deletedFiles: string[], projectPath: string) => {
  const logPath = path.join(EXTERNAL_EXTENSIONS_DIR, projectPath, TARGET_EXTENSION_DIR, DELETED_FILES_LOG);
  const logContent = deletedFiles.join("\n");
  await fs.promises.writeFile(logPath, logContent, "utf8");
  console.log("");
  console.log("Deleted files:", deletedFiles);
  prettyLog.success(`Deleted files logged to ${logPath}\n`, 1);
};

const clearDirectoryContents = async (dirPath: string) => {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    // Skip Git-related files/folders
    if (entry.name === ".git" || entry.name.startsWith(".git")) {
      continue;
    }

    if (entry.isDirectory()) {
      await fs.promises.rm(fullPath, { recursive: true, force: true });
    } else {
      await fs.promises.unlink(fullPath);
    }
  }
};

const clearProjectFolderIfExists = async (projectName: string) => {
  const projectDir = path.join(EXTERNAL_EXTENSIONS_DIR, projectName);
  if (fs.existsSync(projectDir)) {
    await clearDirectoryContents(projectDir);
    prettyLog.success(`Cleared contents of directory: ${projectDir}\n`, 1);
  }
};

const main = async (rawArgs: Args) => {
  try {
    const { projectPath, commitHash } = getProjectPathAndCommitHash(rawArgs);
    const projectName = path.basename(projectPath);

    prettyLog.info(`Extension name: ${projectName}\n`);

    await clearProjectFolderIfExists(projectName);

    prettyLog.info("Getting list of changed files...", 1);
    const changedFiles = await getChangedFilesSinceCommit(projectPath, commitHash);
    const deletedAndRenamedFiles = await getDeletedAndRenamedFilesSinceCommit(projectPath, commitHash);

    if (!changedFiles.length && !deletedAndRenamedFiles.length) {
      prettyLog.warning("No files to process.");
      return;
    }

    if (changedFiles.length) {
      await copyChangedFiles(changedFiles, projectName, projectPath);
    }

    if (deletedAndRenamedFiles.length) {
      await logDeletedFiles(deletedAndRenamedFiles, projectPath);
    }

    await logCommitHash(commitHash, projectName);

    prettyLog.info(`Files processed successfully, updated ${EXTERNAL_EXTENSIONS_DIR}/${projectName} directory.`);
  } catch (err: any) {
    prettyLog.error(`Error: ${err.message}`);
  }
};

main(process.argv).catch(() => process.exit(1));
