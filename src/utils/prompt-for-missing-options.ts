import { Options, RawOptions, SolidityFrameworkChoices } from "../types";
import inquirer from "inquirer";
import { SOLIDITY_FRAMEWORKS } from "./consts";

// default values for unspecified args
const defaultOptions: RawOptions = {
  project: "my-dapp-example",
  solidityFramework: null,
  install: true,
  dev: false,
  externalExtension: null,
  help: false,
};

export async function promptForMissingOptions(
  options: RawOptions,
  solidityFrameworkChoices: SolidityFrameworkChoices,
): Promise<Options> {
  const cliAnswers = Object.fromEntries(Object.entries(options).filter(([, value]) => value !== null));
  const questions = [
    {
      type: "input",
      name: "project",
      message: "Your project name:",
      default: defaultOptions.project,
      validate: (value: string) => {
        if (value.length === 0) return "Project name cannot be empty";
        if (/\s$/.test(value)) return "Project name cannot end with whitespace";
        return true;
      },
    },
    {
      type: "list",
      name: "solidityFramework",
      message: "What solidity framework do you want to use?",
      choices: solidityFrameworkChoices,
      default: SOLIDITY_FRAMEWORKS.HARDHAT,
    },
  ];

  const answers = await inquirer.prompt(questions, cliAnswers);

  const solidityFramework = options.solidityFramework ?? answers.solidityFramework;
  const mergedOptions: Options = {
    project: options.project ?? answers.project,
    install: options.install,
    dev: options.dev ?? defaultOptions.dev,
    solidityFramework: solidityFramework === "none" ? null : solidityFramework,
    externalExtension: options.externalExtension,
  };

  return mergedOptions;
}
