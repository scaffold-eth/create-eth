import path from "path";
import fs from "fs";
import { execa } from "execa";
import { prettyLog, EXTERNAL_EXTENSIONS_DIR, TARGET_EXTENSION_DIR } from "./create-extension-common";
import { assertRepoExists, parseExtensionString, setupRepository } from "../utils/common";
import { SOLIDITY_FRAMEWORKS } from "../utils/consts";
import { promisify } from "util";
import ncp from "ncp";

const ncpPromise = promisify(ncp);

export const DELETED_FILES_LOG = "deletedFiles.log";
export const COMMIT_HASH_LOG = "commitHash.log";
export const SOLIDITY_FRAMEWORK_LOG = "solidityFramework.log";

export const createExtensionFromScaffoldEth = async (projectName: string, scaffoldEthRepo: string | null) => {
  try {
    if (scaffoldEthRepo) {
      const { githubUrl, githubBranchUrl, branch } = parseExtensionString(scaffoldEthRepo);

      await assertRepoExists(githubBranchUrl, githubUrl);

      prettyLog.info(`Creating ${projectName} folder and cloning ${githubBranchUrl}...`, 1);

      await setupRepository(getProjectDirectory(projectName), githubUrl, branch);

      prettyLog.success(`Cloned ${githubBranchUrl} into ${projectName}\n`, 1);
    }

    prettyLog.info("Finding merge base commit hash...", 1);
    const { mergeBaseCommitHash, solidityFramework } = await getMergeBaseCommitHash(projectName);
    prettyLog.success(`Merge base commit hash: ${mergeBaseCommitHash}\n`, 1);

    prettyLog.info("Getting list of changed files...", 1);
    const changedFiles = await getChangedFilesSinceCommit(projectName, mergeBaseCommitHash);
    const deletedAndRenamedFiles = await getDeletedAndRenamedFilesSinceCommit(projectName, mergeBaseCommitHash);

    if (!changedFiles.length && !deletedAndRenamedFiles.length) {
      prettyLog.warning("No files to process.");
      return;
    }

    if (changedFiles.length) {
      await copyChangedFiles(changedFiles, projectName);
      prettyLog.success(`Copied ${changedFiles.length} changed files\n`, 1);
    }

    if (deletedAndRenamedFiles.length) {
      await logData(projectName, DELETED_FILES_LOG, deletedAndRenamedFiles.join("\n"));
    }

    await logData(projectName, COMMIT_HASH_LOG, mergeBaseCommitHash);

    await logData(projectName, SOLIDITY_FRAMEWORK_LOG, solidityFramework);

    await initGitRepo(path.join(EXTERNAL_EXTENSIONS_DIR, projectName));

    prettyLog.info(`Files processed successfully, updated ${EXTERNAL_EXTENSIONS_DIR}/${projectName} directory.`);
  } catch (err: any) {
    prettyLog.error(`Failed to create extension: ${err.message}`);
    throw err;
  } finally {
    if (scaffoldEthRepo) {
      await fs.promises.rm(getProjectDirectory(projectName), { recursive: true, force: true });
      //prettyLog.info(`Cleaned up temporary folder: ${getProjectDirectory(projectName)}\n`, 1);
    }
  }
};

const getMergeBaseCommitHash = async (
  projectName: string,
): Promise<{ mergeBaseCommitHash: string; solidityFramework: string }> => {
  try {
    // Add the scaffold-eth-2 remote if it doesn’t already exist
    await execa("git", ["remote", "add", "scaffold-eth-2", "https://github.com/scaffold-eth/scaffold-eth-2"], {
      cwd: projectName,
      reject: false,
    });

    // Fetch only the main and foundry branches from scaffold-eth-2
    await execa("git", ["fetch", "scaffold-eth-2", "main", "--no-tags"], { cwd: projectName });
    await execa("git", ["fetch", "scaffold-eth-2", "foundry", "--no-tags"], { cwd: projectName });

    // Get the merge base (common ancestor) between HEAD and scaffold-eth-2/main
    const { stdout: mainMergeBase } = await execa("git", ["merge-base", "HEAD", "scaffold-eth-2/main"], {
      cwd: projectName,
    });
    // Get the merge base between HEAD and scaffold-eth-2/foundry
    const { stdout: foundryMergeBase } = await execa("git", ["merge-base", "HEAD", "scaffold-eth-2/foundry"], {
      cwd: projectName,
    });

    // If no merge base exists with either branch, throw an error
    if (!mainMergeBase && !foundryMergeBase) {
      throw new Error("No merge base found with scaffold-eth-2/main or scaffold-eth-2/foundry");
    }

    // Get the current HEAD commit hash of scaffold-eth-2/main
    const { stdout: mainHead } = await execa("git", ["rev-parse", "scaffold-eth-2/main"], { cwd: projectName });
    // Get the current HEAD commit hash of scaffold-eth-2/foundry
    const { stdout: foundryHead } = await execa("git", ["rev-parse", "scaffold-eth-2/foundry"], {
      cwd: projectName,
    });

    // If the merge base with main equals main’s HEAD (and foundry’s doesn’t), assume main is the origin
    if (mainMergeBase === mainHead && foundryMergeBase !== foundryHead) {
      return { mergeBaseCommitHash: mainMergeBase, solidityFramework: SOLIDITY_FRAMEWORKS.HARDHAT };
    }
    // If the merge base with foundry equals foundry’s HEAD (and main’s doesn’t), assume foundry is the origin
    if (foundryMergeBase === foundryHead && mainMergeBase !== mainHead) {
      return { mergeBaseCommitHash: foundryMergeBase, solidityFramework: SOLIDITY_FRAMEWORKS.FOUNDRY };
    }

    // If neither merge base matches a HEAD exactly, compare timestamps to determine the more recent ancestor
    // Get the timestamp (Unix epoch seconds) of the main merge base
    const { stdout: mainMergeDate } = await execa("git", ["show", "-s", "--format=%ct", mainMergeBase], {
      cwd: projectName,
    });
    // Get the timestamp of the foundry merge base
    const { stdout: foundryMergeDate } = await execa("git", ["show", "-s", "--format=%ct", foundryMergeBase], {
      cwd: projectName,
    });

    // Convert timestamps to integers for comparison
    const mainTimestamp = parseInt(mainMergeDate, 10);
    const foundryTimestamp = parseInt(foundryMergeDate, 10);

    // Return the branch with the more recent merge base timestamp
    if (mainTimestamp > foundryTimestamp) {
      // Main’s merge base is more recent, so assume it’s the origin
      return { mergeBaseCommitHash: mainMergeBase, solidityFramework: SOLIDITY_FRAMEWORKS.HARDHAT };
    } else {
      // Foundry’s merge base is more recent (or equal), so assume it’s the origin
      return { mergeBaseCommitHash: foundryMergeBase, solidityFramework: SOLIDITY_FRAMEWORKS.FOUNDRY };
    }
  } catch (error: any) {
    console.error(`Failed to get merge base commit hash: ${error.message}`);
    throw error;
  }
};

const getChangedFilesSinceCommit = async (projectName: string, commitHash: string): Promise<string[]> => {
  try {
    const { stdout } = await execa("git", ["diff", "--diff-filter=d", "--name-only", `${commitHash}..HEAD`], {
      cwd: projectName,
    });

    return stdout.split("\n").filter(Boolean);
  } catch (error: any) {
    console.error(`Failed to get changed files since commit: ${error.message}`);
    throw error;
  }
};

const getDeletedAndRenamedFilesSinceCommit = async (projectName: string, commitHash: string): Promise<string[]> => {
  try {
    const { stdout: gitOutput } = await execa(
      "git",
      ["diff", "--diff-filter=DR", "--name-status", `${commitHash}..HEAD`],
      { cwd: projectName },
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
  } catch (error: any) {
    console.error(`Failed to get deleted and renamed files: ${error.message}`);
    throw error;
  }
};

const copyChangedFiles = async (changedFiles: string[], projectName: string) => {
  try {
    for (const filePath of changedFiles) {
      const sourcePath = path.resolve(projectName, filePath);
      const destPath = path.join(EXTERNAL_EXTENSIONS_DIR, projectName, TARGET_EXTENSION_DIR, filePath);

      if (!fs.existsSync(sourcePath)) continue;

      await createDirectory(filePath, projectName);
      await ncpPromise(sourcePath, destPath);
    }
  } catch (error: any) {
    console.error(`Failed to copy changed files: ${error.message}`);
    throw error;
  }
};
const createDirectory = async (filePath: string, projectName: string) => {
  const dirPath = path.join(EXTERNAL_EXTENSIONS_DIR, projectName, TARGET_EXTENSION_DIR, path.dirname(filePath));
  await fs.promises.mkdir(dirPath, { recursive: true });
};

const logData = async (projectName: string, fileName: string, fileContent: string) => {
  try {
    const logPath = path.join(EXTERNAL_EXTENSIONS_DIR, projectName, TARGET_EXTENSION_DIR, fileName);
    await fs.promises.writeFile(logPath, fileContent, "utf8");
    prettyLog.success(`${fileName} logged to ${logPath}\n`, 1);
  } catch (error: any) {
    console.error(`Failed to log data to ${fileName}: ${error.message}`);
    throw error;
  }
};

const initGitRepo = async (targetPath: string) => {
  try {
    const gitDir = path.join(targetPath, ".git");
    if (fs.existsSync(gitDir)) {
      return; // Git repo already exists, likely from a previous run
    }

    await execa("git", ["init"], { cwd: targetPath });
    await execa("git", ["add", "."], { cwd: targetPath });
    await execa("git", ["commit", "-m", "Initial commit"], { cwd: targetPath });

    prettyLog.success(`Initialized git repository and made initial commit in ${targetPath}\n`, 1);
  } catch (error: any) {
    console.error(`Failed to initialize git repository: ${error.message}`);
    throw error;
  }
};

const getProjectDirectory = (projectName: string) => path.resolve(process.cwd(), projectName);
