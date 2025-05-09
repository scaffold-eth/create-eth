import { execa } from "execa";
import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import { Options } from "../types";

export const EXTERNAL_EXTENSION_TMP_DIR = "tmp-external-extension";

export const parseExtensionString = (extension: string) => {
  const isGithubUrl = extension.startsWith("https://github.com/");
  const regex = /^[^/]+\/[^/]+(:[^/]+)?$/;

  if (!regex.test(extension) && !isGithubUrl) {
    throw new Error(`Invalid extension format. Use "owner/project", "owner/project:branch" or github url.`);
  }

  let owner, project, branch;

  if (isGithubUrl) {
    const { ownerName, repoName, branch: urlBranch } = deconstructGithubUrl(extension);
    owner = ownerName;
    project = repoName;
    branch = urlBranch;
  } else {
    owner = extension.split("/")[0];
    project = extension.split(":")[0].split("/")[1];
    branch = extension.split(":")[1];
  }

  const githubUrl = `https://github.com/${owner}/${project}`;
  const githubBranchUrl = branch ? `https://github.com/${owner}/${project}/tree/${branch}` : githubUrl;

  return {
    githubUrl,
    githubBranchUrl,
    owner,
    project,
    branch,
  };
};

export function deconstructGithubUrl(url: string) {
  const urlParts = url.split("/");
  const ownerName = urlParts[3];
  const repoName = urlParts[4];
  const branch = urlParts[5] === "tree" ? urlParts[6] : undefined;

  return { ownerName, repoName, branch };
}

export async function assertRepoExists(githubBranchUrl: string, githubUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https
      .get(githubBranchUrl, res => {
        if (res.statusCode !== 200) {
          reject(new Error(`Extension not found: ${githubUrl}`));
        } else {
          resolve();
        }
      })
      .on("error", err => {
        reject(err);
      });
  });
}

export const setupRepository = async (targetDirectory: string, repository: string, branch?: string | null) => {
  // 1. Create targetDirectory if needed
  await fs.promises.mkdir(targetDirectory, { recursive: true });

  // 2. Clone the repository
  if (branch) {
    await execa("git", ["clone", "--branch", branch, repository, targetDirectory], {
      cwd: targetDirectory,
    });
  } else {
    await execa("git", ["clone", repository, targetDirectory], { cwd: targetDirectory });
  }
};

export const deleteTempDirectory = async (options: Options, tmpDir: string) => {
  if (options.externalExtension && !options.dev) {
    await fs.promises.rm(tmpDir, { recursive: true });
  }
};

export const getExternalExtensionsDirectory = (): string => {
  const currentFileUrl = import.meta.url;
  return path.resolve(decodeURI(fileURLToPath(currentFileUrl)), "../../externalExtensions");
};
