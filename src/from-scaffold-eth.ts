import { execa } from "execa";
import type { ExternalExtension, Options } from "./types";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import ncp from "ncp";
import { COMMIT_HASH_LOG, DELETED_FILES_LOG, SOLIDITY_FRAMEWORK_LOG } from "./dev/create-extension-from-scaffold-eth";
import { deleteTempDirectory, setupRepository, EXTERNAL_EXTENSION_TMP_DIR } from "./utils/common";
import { SOLIDITY_FRAMEWORKS } from "./utils/consts";

// ToDo: Prepare for branch switching, main branch uses hardhat right now, but it can change in the future
const SCAFFOLD_ETH_2_REPOSITORY_URL = "https://github.com/scaffold-eth/scaffold-eth-2";
const FOUNDRY_BRANCH = "foundry";

const copy = promisify(ncp);

export const createProjectFromScaffoldEth = async (options: Options, projectName: string) => {
  await setupRepository(
    projectName,
    SCAFFOLD_ETH_2_REPOSITORY_URL,
    options.solidityFramework === SOLIDITY_FRAMEWORKS.FOUNDRY ? FOUNDRY_BRANCH : null,
  );

  if (!options.dev) {
    await setupRepository(
      getTempDirectory(projectName),
      (options.externalExtension as ExternalExtension).repository,
      (options.externalExtension as ExternalExtension).branch,
    );
  }

  const externalExtensionPath = getExternalExtensionPath(options, projectName);

  await resetToCommitHash(externalExtensionPath, projectName);

  await copy(externalExtensionPath, projectName, {
    filter: file => {
      const relativePath = path.relative(externalExtensionPath, file);
      return ![COMMIT_HASH_LOG, DELETED_FILES_LOG, SOLIDITY_FRAMEWORK_LOG].includes(relativePath);
    },
  });

  await removeLoggedDeletedFiles(externalExtensionPath, projectName);

  await deleteTempDirectory(options, getTempDirectory(projectName));

  await commitChanges(projectName);
};

const resetToCommitHash = async (externalExtensionPath: string, targetDir: string) => {
  try {
    const logPath = path.join(externalExtensionPath, COMMIT_HASH_LOG);

    if (!fs.existsSync(logPath)) {
      throw new Error(`No commit hash log found at: ${logPath}`);
    }

    const commitHash = (await fs.promises.readFile(logPath, "utf8")).trim();

    if (!commitHash) {
      throw new Error("Commit hash log is empty");
    }

    await execa("git", ["reset", "--hard", commitHash], { cwd: targetDir });
  } catch (error: any) {
    console.error(`Failed to reset to commit hash: ${error.message}`);
    throw error;
  }
};

const removeLoggedDeletedFiles = async (externalExtensionPath: string, targetDir: string) => {
  try {
    const logPath = path.join(externalExtensionPath, DELETED_FILES_LOG);

    if (fs.existsSync(logPath)) {
      const deletedFilesContent = await fs.promises.readFile(logPath, "utf8");
      const deletedFilePaths = deletedFilesContent.split("\n").filter(Boolean);

      for (const deletedFilePath of deletedFilePaths) {
        const fullPath = path.join(targetDir, deletedFilePath);
        if (fs.existsSync(fullPath)) {
          await fs.promises.unlink(fullPath);
        }
      }
    }
  } catch (error: any) {
    console.error(`Failed to remove logged deleted files: ${error.message}`);
    throw error;
  }
};

const commitChanges = async (targetDir: string) => {
  try {
    await execa("git", ["add", "--all"], { cwd: targetDir });
    await execa("git", ["commit", "-m", "Apply changes from extension"], { cwd: targetDir });
  } catch (error: any) {
    console.error(`Failed to commit changes: ${error.message}`);
    throw error;
  }
};

const getExternalExtensionPath = (options: Options, projectName: string) => {
  if (options.dev) {
    return path.join("externalExtensions", options.externalExtension as string, "extension");
  }

  return path.join(getTempDirectory(projectName), "extension");
};

const getTempDirectory = (projectName: string) => path.join(projectName, EXTERNAL_EXTENSION_TMP_DIR);
