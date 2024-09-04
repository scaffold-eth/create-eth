import chalk from "chalk";
import { execa } from "execa";

export const validateFoundryUp = async () => {
  try {
    await execa("foundryup", ["-h"]);
  } catch (error) {
    // Check if we're running in a CI environment
    if (process.env.CI) {
      console.warn(chalk.yellow("Running in CI environment. Skipping foundryup check."));
      return;
    }

    const message = ` ${chalk.bold.yellow("Attention: Foundryup is not installed in your system.")}
 ${chalk.bold.yellow("To use foundry, please install foundryup")}
 ${chalk.bold.yellow("Checkout: https://getfoundry.sh")}
    `;
    throw new Error(message);
  }
};
