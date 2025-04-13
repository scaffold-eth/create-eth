import fs from "fs";
import type { Args, SolidityFramework, RawOptions, SolidityFrameworkChoices } from "../types";
import arg from "arg";
import { getSolidityFrameworkDirsFromExternalExtension, validateExternalExtension } from "./external-extensions";
import chalk from "chalk";
import { SOLIDITY_FRAMEWORKS } from "./consts";
import { validateFoundryUp } from "./system-validation";
import { validateNpmName } from "./validate-name";
import { deconstructGithubUrl, getExternalExtensionsDirectory } from "./common";
import { SOLIDITY_FRAMEWORK_LOG } from "../dev/create-extension-from-scaffold-eth";

// TODO update smartContractFramework code with general extensions
export async function parseArgumentsIntoOptions(
  rawArgs: Args,
): Promise<{ rawOptions: RawOptions; solidityFrameworkChoices: SolidityFrameworkChoices; fromScaffoldEth: boolean }> {
  const args = arg(
    {
      "--skip-install": Boolean,
      "--skip": "--skip-install",

      "--dev": Boolean,

      "--solidity-framework": solidityFrameworkHandler,
      "-s": "--solidity-framework",

      "--extension": String,
      "-e": "--extension",

      "--help": Boolean,
      "-h": "--help",
    },
    {
      argv: rawArgs.slice(2),
    },
  );

  const skipInstall = args["--skip-install"] ?? null;

  const dev = args["--dev"] ?? false; // info: use false avoid asking user

  const help = args["--help"] ?? false;

  let project: string | null = args._[0] ?? null;

  // use the original extension arg
  const extensionName = args["--extension"];
  // ToDo. Allow multiple
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

  if (project) {
    const validation = validateNpmName(project);
    if (!validation.valid) {
      console.error(
        `Could not create a project called ${chalk.yellow(`"${project}"`)} because of naming restrictions:`,
      );

      validation.problems.forEach(p => console.error(`${chalk.red(">>")} Project ${p}`));
      project = null;
    }
  }

  let solidityFrameworkChoices = [
    SOLIDITY_FRAMEWORKS.HARDHAT,
    SOLIDITY_FRAMEWORKS.FOUNDRY,
    { value: null, name: "none" },
  ];

  if (extension) {
    const externalExtensionSolidityFrameworkDirs = await getSolidityFrameworkDirsFromExternalExtension(extension);

    if (externalExtensionSolidityFrameworkDirs.length !== 0) {
      solidityFrameworkChoices = externalExtensionSolidityFrameworkDirs;
    }
  }

  // if lengh is 1, we don't give user a choice and set it ourselves.
  let solidityFramework =
    solidityFrameworkChoices.length === 1 ? solidityFrameworkChoices[0] : (args["--solidity-framework"] ?? null);

  const { fromScaffoldEth, fromScaffoldEthSolidityFramework } = !extension
    ? { fromScaffoldEth: false, fromScaffoldEthSolidityFramework: null }
    : await detectFromScaffoldEth(extension);
  // From scaffold-eth support hardhat or foundry, not both
  if (fromScaffoldEth) {
    solidityFramework = fromScaffoldEthSolidityFramework;
  }

  if (solidityFramework === SOLIDITY_FRAMEWORKS.FOUNDRY) {
    await validateFoundryUp();
  }

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
    fromScaffoldEth,
  };
}

const SOLIDITY_FRAMEWORK_OPTIONS = [...Object.values(SOLIDITY_FRAMEWORKS), "none"];
function solidityFrameworkHandler(value: string) {
  const lowercasedValue = value.toLowerCase();
  if (SOLIDITY_FRAMEWORK_OPTIONS.includes(lowercasedValue)) {
    return lowercasedValue as SolidityFramework | "none";
  }

  // choose from cli prompts
  return null;
}

// If the extension was created from scaffold-eth, it will have a file called ${SOLIDITY_FRAMEWORK_LOG}
export const detectFromScaffoldEth = async (
  externalExtension: NonNullable<RawOptions["externalExtension"]>,
): Promise<{ fromScaffoldEth: boolean; fromScaffoldEthSolidityFramework: SolidityFramework | null }> => {
  let solidityFramework = null;

  try {
    if (typeof externalExtension === "string") {
      // dev mode
      const externalExtensionsDirectory = getExternalExtensionsDirectory();
      const logPath = `${externalExtensionsDirectory}/${externalExtension}/extension/${SOLIDITY_FRAMEWORK_LOG}`;
      solidityFramework = (await fs.promises.readFile(logPath, "utf8")).trim();
    } else {
      const { branch, repository } = externalExtension;
      const { ownerName, repoName } = deconstructGithubUrl(repository);

      const githubApiUrl = `https://api.github.com/repos/${ownerName}/${repoName}/contents/extension/${SOLIDITY_FRAMEWORK_LOG}${branch ? `?ref=${branch}` : ""}`;
      const res = await fetch(githubApiUrl);
      const data = await res.json();
      // Use Buffer to decode base64 content
      const content = Buffer.from(data.content, "base64").toString("utf8");
      solidityFramework = content.trim();
    }

    if (solidityFramework) {
      if (solidityFramework !== SOLIDITY_FRAMEWORKS.HARDHAT && solidityFramework !== SOLIDITY_FRAMEWORKS.FOUNDRY) {
        throw new Error(`Invalid Solidity framework: ${solidityFramework}`);
      }
      return { fromScaffoldEth: true, fromScaffoldEthSolidityFramework: solidityFramework };
    }

    return { fromScaffoldEth: false, fromScaffoldEthSolidityFramework: null };
  } catch {
    return { fromScaffoldEth: false, fromScaffoldEthSolidityFramework: null };
  }
};
