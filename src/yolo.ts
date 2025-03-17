import { execa } from "execa";
import { createProjectDirectory, prettierFormat, installPackages } from "./tasks";
import type { ExternalExtension, Options } from "./types";
import { renderOutroMessage } from "./utils/render-outro-message";
import chalk from "chalk";
import { Listr } from "listr2";
import path from "path";
import { getArgumentFromExternalExtensionOption } from "./utils/external-extensions";
import fs from "fs";
import { promisify } from "util";
import ncp from "ncp";

const DELETED_FILES_LOG = "deletedFiles.log";
const COMMIT_HASH_LOG = "commitHash.log";
const EXTERNAL_EXTENSION_TMP_DIR = "tmp-external-extension";

const copy = promisify(ncp);

const cloneGitRepo = async (repositoryUrl: string, targetDir: string): Promise<void> => {
  try {
    // 1. Create the target directory if it doesn't exist
    await fs.promises.mkdir(targetDir, { recursive: true });

    // 2. Clone the repository
    await execa("git", ["clone", repositoryUrl, targetDir], { cwd: targetDir });

    console.log(`Repository cloned to ${targetDir}`);
  } catch (error: any) {
    console.error(`Error cloning repository: ${error.message}`);
    throw error;
  }
};

const resetToCommitHash = async (externalExtensionPath: string, targetDir: string) => {
  const logPath = path.join(externalExtensionPath, COMMIT_HASH_LOG);

  if (fs.existsSync(logPath)) {
    const commitHash = (await fs.promises.readFile(logPath, "utf8")).trim();
    if (commitHash) {
      try {
        console.log(`Resetting repository to commit hash: ${commitHash}`);
        await execa("git", ["reset", "--hard", commitHash], { cwd: targetDir });
        console.log(`Repository successfully reset to commit hash: ${commitHash}`);
      } catch (error: any) {
        console.error(`Error resetting to commit hash: ${error.message}`);
        throw error;
      }
    } else {
      console.warn("Commit hash log is empty. Skipping reset.");
    }
  } else {
    console.warn(`No commit hash log found at: ${logPath}. Skipping reset.`);
  }
};

const removeLoggedDeletedFiles = async (externalExtensionPath: string, targetDir: string) => {
  const logPath = path.join(externalExtensionPath, DELETED_FILES_LOG);
  console.log(`Checking for previously logged deleted files at: ${logPath}`);
  if (fs.existsSync(logPath)) {
    const deletedFilesContent = await fs.promises.readFile(logPath, "utf8");
    const deletedFiles = deletedFilesContent.split("\n").filter(Boolean);

    for (const file of deletedFiles) {
      const filePath = path.join(targetDir, file);
      console.log(`Checking deleted file: ${file}`, filePath);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log(`Removed previously logged deleted file: ${file}`);
      }
    }
  }
};

const commitChanges = async (targetDir: string) => {
  try {
    console.log("Staging all changes...");
    await execa("git", ["add", "--all"], { cwd: targetDir });

    console.log("Committing changes...");
    await execa("git", ["commit", "-m", "Apply changes from extension"], { cwd: targetDir });

    console.log("Changes committed successfully.");
  } catch (error: any) {
    console.error(`Error committing changes: ${error.message}`);
    throw error;
  }
};

const setUpExternalExtensionFiles = async (options: Options, tmpDir: string) => {
  // 1. Create tmp directory to clone external extension
  await fs.promises.mkdir(tmpDir);

  const { repository, branch } = options.externalExtension as ExternalExtension;

  // 2. Clone external extension
  if (branch) {
    await execa("git", ["clone", "--branch", branch, repository, tmpDir], {
      cwd: tmpDir,
    });
  } else {
    await execa("git", ["clone", repository, tmpDir], { cwd: tmpDir });
  }
};

const createExtension = async (options: Options, targetDir: string) => {
  await cloneGitRepo("https://github.com/scaffold-eth/scaffold-eth-2", targetDir);

  const tmpDir = path.join(targetDir, EXTERNAL_EXTENSION_TMP_DIR);

  let externalExtensionPath = path.join(tmpDir, "extension");

  if (options.dev) {
    externalExtensionPath = path.join("externalExtensions", options.externalExtension as string, "extension");
  } else {
    await setUpExternalExtensionFiles(options, tmpDir);
  }

  await resetToCommitHash(externalExtensionPath, targetDir);

  await copy(externalExtensionPath, targetDir, {
    filter: file => {
      const relativePath = path.relative(externalExtensionPath, file);
      return ![DELETED_FILES_LOG, COMMIT_HASH_LOG].includes(relativePath);
    },
  });

  await removeLoggedDeletedFiles(externalExtensionPath, targetDir);

  await commitChanges(targetDir);
};

export async function createProjectYolo(options: Options) {
  console.log(`\n`);
  console.log("Yolo mode activated! 🚀");

  // const currentFileUrl = import.meta.url;

  const targetDirectory = path.resolve(process.cwd(), options.project);

  const tasks = new Listr(
    [
      {
        title: `📁 Create project directory ${targetDirectory}`,
        task: () => createProjectDirectory(options.project),
      },
      {
        title: `🚀 Creating a new Scaffold-ETH 2 app in ${chalk.green.bold(
          options.project,
        )}${options.externalExtension ? ` with the ${chalk.green.bold(options.dev ? options.externalExtension : getArgumentFromExternalExtensionOption(options.externalExtension))} extension` : ""}`,
        //task: () => copyTemplateFiles(options, templateDirectory, targetDirectory),
        task: () => createExtension(options, targetDirectory),
      },
      {
        title: "📦 Installing dependencies with yarn, this could take a while",
        task: (_, task) => installPackages(targetDirectory, task),
        skip: () => {
          if (!options.install) {
            return "Manually skipped, since `--skip-install` flag was passed";
          }
          return false;
        },
        rendererOptions: {
          outputBar: 8,
          persistentOutput: false,
        },
      },
      {
        title: "🪄 Formatting files",
        task: () => prettierFormat(targetDirectory),
        skip: () => {
          if (!options.install) {
            return "Can't use source prettier, since `yarn install` was skipped";
          }
          return false;
        },
      },
      // {
      //   title: `📡 Initializing Git repository${options.solidityFramework === SOLIDITY_FRAMEWORKS.FOUNDRY ? " and submodules" : ""}`,
      //   task: () => createFirstGitCommit(targetDirectory, options),
      // },
    ],
    { rendererOptions: { collapseSkips: false, suffixSkips: true } },
  );

  try {
    await tasks.run();
    renderOutroMessage(options);
  } catch (error) {
    console.log("%s Error occurred", chalk.red.bold("ERROR"), error);
    console.log("%s Exiting...", chalk.red.bold("Uh oh! 😕 Sorry about that!"));
  }
}
