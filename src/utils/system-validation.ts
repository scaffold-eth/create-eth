import chalk from "chalk";
import { execa } from "execa";
import semver from "semver";

export const validateFoundryUp = async () => {
  try {
    await execa("foundryup", ["-h"]);
  } catch {
    const message = ` ${chalk.bold.yellow("Attention: Foundryup is not installed in your system.")}
 ${chalk.bold.yellow("To use foundry, please install foundryup")}
 ${chalk.bold.yellow("Checkout: https://getfoundry.sh")}
    `;
    throw new Error(message);
  }
};

export const checkSystemRequirements = async () => {
  const errors: string[] = [];

  try {
    const { stdout: nodeVersion } = await execa("node", ["--version"]);
    const cleanNodeVersion = nodeVersion.replace("v", "");
    if (!semver.gte(cleanNodeVersion, "20.18.3")) {
      errors.push(`Node.js version must be >= 20.18.3. Current version: ${nodeVersion}`);
    }
  } catch {
    errors.push("Node.js is not installed. Please install Node.js >= 20.18.3");
  }

  try {
    const { stdout: yarnVersion } = await execa("yarn", ["--version"]);
    if (!semver.gte(yarnVersion, "1.0.0")) {
      errors.push(`Yarn version should be >= 1.0.0. Recommended version is >= 2.0.0. Current version: ${yarnVersion}`);
    }
  } catch {
    errors.push("Yarn is not installed. Please install Yarn >= 1.0.0. Recommended version is >= 2.0.0");
  }

  try {
    const { stdout: gitVersion } = await execa("git", ["--version"]);
    // Handle both Windows and Unix-style Git version outputs
    // Windows: git version 2.39.2.windows.1
    // Unix: git version 2.39.2
    const versionMatch = gitVersion.match(/(\d+\.\d+\.\d+)/);
    const cleanGitVersion = versionMatch ? versionMatch[1] : null;

    if (cleanGitVersion && !semver.gte(cleanGitVersion, "2.20.0")) {
      errors.push(`Git version should be >= 2.20.0 for modern features. Current version: ${gitVersion}`);
    }
  } catch {
    errors.push("Git is not installed. Please install Git >= 2.20.0");
  }

  return { errors };
};
