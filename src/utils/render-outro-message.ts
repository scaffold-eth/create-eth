import type { Options } from "../types";
import chalk from "chalk";
import { execa } from "execa";
import { SOLIDITY_FRAMEWORKS } from "./consts";

export async function renderOutroMessage(options: Options) {
  let message = `
  \n
  ${chalk.bold.green("Congratulations!")} Your project has been scaffolded! 🎉

  ${chalk.bold("Next steps:")}
  
  ${chalk.dim("cd")} ${options.project}
  `;

  if (
    options.extensions.includes(SOLIDITY_FRAMEWORKS.HARDHAT) ||
    options.extensions.includes(SOLIDITY_FRAMEWORKS.FOUNDRY)
  ) {
    message += `
    \t${chalk.bold("Start the local development node")}
    \t${chalk.dim("yarn")} chain
    `;

    if (options.extensions.includes(SOLIDITY_FRAMEWORKS.FOUNDRY)) {
      try {
        await execa("foundryup", ["-h"]);
      } catch (error) {
        message += `
      \t${chalk.bold.yellow("(NOTE: Foundryup is not installed in your system)")}
      \t${chalk.dim("Checkout: https://getfoundry.sh")}
      `;
      }
    }

    message += `
    \t${chalk.bold("In a new terminal window, deploy your contracts")}
    \t${chalk.dim("yarn")} deploy
   `;
  }

  message += `
  \t${chalk.bold("In a new terminal window, start the frontend")}
  \t${chalk.dim("yarn")} start
  `;

  message += `
  ${chalk.bold.green("Thanks for using Scaffold-ETH 2 🙏, Happy Building!")}
  `;

  console.log(message);
}
