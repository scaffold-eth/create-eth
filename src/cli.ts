import { createProject } from "./main";
import { parseArgumentsIntoOptions } from "./utils/parse-arguments-into-options";
import { promptForMissingOptions } from "./utils/prompt-for-missing-options";
import { renderIntroMessage } from "./utils/render-intro-message";
import type { Args } from "./types";
import chalk from "chalk";
import { SOLIDITY_FRAMEWORKS } from "./utils/consts";
import { validateFoundryYup } from "./utils/system-validation";

export async function cli(args: Args) {
  try {
    renderIntroMessage();
    const rawOptions = await parseArgumentsIntoOptions(args);
    const options = await promptForMissingOptions(rawOptions);
    if (options.extensions.includes(SOLIDITY_FRAMEWORKS.FOUNDRY)) {
      await validateFoundryYup();
    }
    await createProject(options);
  } catch (error: any) {
    console.error(chalk.red.bold(error.message || "An unknown error occurred."));
    return;
  }
}
