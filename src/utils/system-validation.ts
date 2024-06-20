import chalk from "chalk";
import { execa } from "execa";

export const validateFoundryYup = async () => {
  try {
    await execa("foundryup", ["-h"]);
  } catch (error) {
    const message = `${chalk.bold.yellow("NOTE: Foundryup is not installed in your system.")}
${chalk.bold.yellow("To use foundry, please install foundryup")}
${chalk.bold.yellow("Checkout: https://getfoundry.sh")}
    `;
    throw new Error(message);
  }
};
