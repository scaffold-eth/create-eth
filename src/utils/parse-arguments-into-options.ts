import type { Args, RawOptions, SolidityFrameworkChoices } from "../types";
import { getSolidityFrameworkDirsFromExternalExtension, validateExternalExtension } from "./external-extensions";
import chalk from "chalk";
import { SOLIDITY_FRAMEWORKS } from "./consts";
import { validateNpmName } from "./validate-name";
import { confirm } from "@inquirer/prompts";
import packageJson from "../../package.json";
import { execa } from "execa";
import { parseCliArgs } from "./parse-cli-args";

type ResolvedExtension = Awaited<ReturnType<typeof validateExternalExtension>> | null;

// Validates the extension argument (network in non-dev mode) and warns on untrusted third-party sources.
const resolveExternalExtension = async (
  extensionName: string | undefined,
  dev: boolean,
): Promise<ResolvedExtension> => {
  const extension = extensionName ? await validateExternalExtension(extensionName, dev) : null;

  // if dev mode, extension would be a string
  if (extension && typeof extension === "object" && !extension.isTrusted) {
    console.log(
      chalk.yellow(
        ` You are using a third-party extension. Make sure you trust the source of ${chalk.yellow.bold(
          extension.repository,
        )}\n`,
      ),
    );
  }

  return extension;
};

// Interactive guard: when the extension recommends a different create-eth version, offer to switch (and exit).
const ensureCompatibleCreateEthVersion = async (extension: ResolvedExtension, rawArgs: Args) => {
  if (!(extension && typeof extension === "object" && extension.recommendedCreateEthVersion)) {
    return;
  }

  const currentVersion = packageJson.version;
  if (extension.recommendedCreateEthVersion === currentVersion) {
    return;
  }

  console.log(
    chalk.yellow(
      `\n⚠️  This extension requires create-eth ${chalk.bold(`v${extension.recommendedCreateEthVersion}`)}, but you're running ${chalk.bold(`v${currentVersion}`)}.\n`,
    ),
  );

  const switchVersion = await confirm({
    message: `Would you like to run with the correct version (${extension.recommendedCreateEthVersion})?`,
    default: true,
  });

  if (switchVersion) {
    console.log(chalk.gray(`\nSwitching to create-eth@${extension.recommendedCreateEthVersion}...\n`));

    await execa("npx", [`create-eth@${extension.recommendedCreateEthVersion}`, ...rawArgs.slice(2)], {
      stdio: "inherit",
    });

    process.exit(0);
  }

  const proceed = await confirm({
    message: "Do you want to proceed with the current version anyway?",
    default: false,
  });

  if (!proceed) {
    console.log(chalk.gray("\nSetup cancelled. No project was created"));
    process.exit(0);
  }
};

// Returns the project name if valid, otherwise prints the problems and returns null (prompt later).
const validateProjectName = (project: string | null): string | null => {
  if (!project) {
    return null;
  }

  const validation = validateNpmName(project);
  if (validation.valid) {
    return project;
  }

  console.error(`Could not create a project called ${chalk.yellow(`"${project}"`)} because of naming restrictions:`);
  validation.problems.forEach(p => console.error(`${chalk.red(">>")} Project ${p}`));
  return null;
};

const resolveSolidityFrameworkChoices = async (extension: ResolvedExtension): Promise<SolidityFrameworkChoices> => {
  const defaultChoices: SolidityFrameworkChoices = [
    SOLIDITY_FRAMEWORKS.HARDHAT,
    SOLIDITY_FRAMEWORKS.FOUNDRY,
    { value: null, name: "none" },
  ];

  if (!extension) {
    return defaultChoices;
  }

  const externalExtensionSolidityFrameworkDirs = await getSolidityFrameworkDirsFromExternalExtension(extension);
  return externalExtensionSolidityFrameworkDirs.length !== 0 ? externalExtensionSolidityFrameworkDirs : defaultChoices;
};

export async function parseArgumentsIntoOptions(
  rawArgs: Args,
): Promise<{ rawOptions: RawOptions; solidityFrameworkChoices: SolidityFrameworkChoices }> {
  const {
    skipInstall,
    dev,
    help,
    project: projectArg,
    extensionName,
    solidityFramework: solidityFrameworkArg,
  } = parseCliArgs(rawArgs);

  const extension = await resolveExternalExtension(extensionName, dev);
  await ensureCompatibleCreateEthVersion(extension, rawArgs);

  const project = validateProjectName(projectArg);
  const solidityFrameworkChoices = await resolveSolidityFrameworkChoices(extension);

  // if length is 1, we don't give user a choice and set it ourselves.
  const solidityFramework = solidityFrameworkChoices.length === 1 ? solidityFrameworkChoices[0] : solidityFrameworkArg;

  return {
    rawOptions: {
      project,
      install: !skipInstall,
      dev,
      externalExtension: extension,
      help,
      solidityFramework: solidityFramework as RawOptions["solidityFramework"],
    },
    solidityFrameworkChoices,
  };
}
