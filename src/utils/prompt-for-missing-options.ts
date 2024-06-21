import { config } from "../config";
import { Options, RawOptions, isDefined, isExtension } from "../types";
import inquirer from "inquirer";
import { extensionDict } from "./extensions-dictionary";

// default values for unspecified args
const defaultOptions: RawOptions = {
  project: "my-dapp-example",
  install: true,
  dev: false,
  externalExtension: null,
  help: false,
  solidityFramework: null,
};

const invalidQuestionNames = ["project", "install"];
const nullExtensionChoice = {
  name: "none",
  value: null,
};

export async function promptForMissingOptions(options: RawOptions): Promise<Options> {
  const cliAnswers = Object.fromEntries(Object.entries(options).filter(([, value]) => value !== null));
  const questions = [];

  questions.push({
    type: "input",
    name: "project",
    message: "Your project name:",
    default: defaultOptions.project,
    validate: (value: string) => value.length > 0,
  });

  config.questions.forEach(question => {
    if (invalidQuestionNames.includes(question.name)) {
      throw new Error(
        `The name of the question can't be "${question.name}". The invalid names are: ${invalidQuestionNames
          .map(w => `"${w}"`)
          .join(", ")}`,
      );
    }

    const extensions = question.extensions
      .filter(isExtension)
      .map(ext => extensionDict[ext])
      .filter(isDefined);

    const hasNoneOption = question.extensions.includes(null);

    questions.push({
      type: question.type === "multi-select" ? "checkbox" : "list",
      name: question.name,
      message: question.message,
      choices: hasNoneOption ? [...extensions, nullExtensionChoice] : extensions,
    });
  });

  questions.push({
    type: "confirm",
    name: "install",
    message: "Install packages?",
    default: defaultOptions.install,
  });

  const answers = await inquirer.prompt(questions, cliAnswers);

  const mergedOptions: Options = {
    project: options.project ?? answers.project,
    install: options.install ?? answers.install,
    dev: options.dev ?? defaultOptions.dev,
    extensions: [options.solidityFramework ?? answers.solidityFramework].filter(ext => Boolean(ext) && ext !== "none"),
    externalExtension: options.externalExtension,
  };

  return mergedOptions;
}
