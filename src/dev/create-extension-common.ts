import chalk from "chalk";

export const EXTERNAL_EXTENSIONS_DIR = "externalExtensions";
export const TARGET_EXTENSION_DIR = "extension";

export const prettyLog = {
  info: (message: string, indent = 0) => console.log(chalk.cyan(`${"  ".repeat(indent)}${message}`)),
  success: (message: string, indent = 0) => console.log(chalk.green(`${"  ".repeat(indent)}✔︎ ${message}`)),
  warning: (message: string, indent = 0) => console.log(chalk.yellow(`${"  ".repeat(indent)}⚠ ${message}`)),
  error: (message: string, indent = 0) => console.log(chalk.red(`${"  ".repeat(indent)}✖ ${message}`)),
};
