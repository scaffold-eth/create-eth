import chalk from "chalk";
import { execa } from "execa";
import semver from "semver";

const RECOMMENDED_FOUNDRY_VERSION = "1.4.0";

export const validateFoundry = async () => {
  try {
    const { stdout: forgeVersion } = await execa("forge", ["--version"]);
    // Extract version from output like "forge Version: 1.4.3-stable"
    const versionMatch = forgeVersion.match(/forge Version: (\d+\.\d+\.\d+)/);
    if (!versionMatch) {
      const message = ` ${chalk.bold.yellow("Attention: Could not parse foundry version.")}
 ${chalk.bold.yellow("Please ensure foundry is properly installed")}
 ${chalk.bold.yellow("Checkout: https://getfoundry.sh")}
    `;
      throw new Error(message);
    }

    const version = versionMatch[1];
    if (semver.lt(version, RECOMMENDED_FOUNDRY_VERSION)) {
      console.log(chalk.bold.yellow("⚠️  Warning: Foundry version is older than recommended."));
      console.log(chalk.yellow(`   Current version: ${version}, recommended: >= ${RECOMMENDED_FOUNDRY_VERSION}`));
      console.log(chalk.yellow("   Consider updating foundry by running: foundryup"));
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Attention:")) {
      throw error;
    }
    const message = `
 ${chalk.bold.yellow("Foundry is not installed or not accessible.")}
 ${chalk.bold.yellow("Please install foundry using foundryup")}
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
    if (semver.lt(cleanNodeVersion, "20.18.3")) {
      errors.push(`Node.js version must be >= 20.18.3. Current version: ${nodeVersion}`);
    }
  } catch {
    errors.push("Node.js is not installed. Please install Node.js >= 20.18.3");
  }

  try {
    const { stdout: yarnVersion } = await execa("yarn", ["--version"]);
    if (semver.lt(yarnVersion, "1.0.0")) {
      errors.push(`Yarn version should be >= 1.0.0. Recommended version is >= 2.0.0. Current version: ${yarnVersion}`);
    }
  } catch {
    errors.push("Yarn is not installed. Please install Yarn >= 1.0.0. Recommended version is >= 2.0.0");
  }

  try {
    await execa("git", ["--version"]);

    try {
      await execa("git", ["config", "user.name"]);
    } catch {
      errors.push("Git user.name is not configured. Please set it using: git config --global user.name 'Your Name'");
    }

    try {
      await execa("git", ["config", "user.email"]);
    } catch {
      errors.push(
        "Git user.email is not configured. Please set it using: git config --global user.email 'your.email@example.com'",
      );
    }
  } catch {
    errors.push("Git is not installed. Please install Git");
  }

  return { errors };
};
