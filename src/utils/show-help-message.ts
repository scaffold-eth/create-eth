import chalk from "chalk";

export const showHelpMessage = () => {
  console.log(` ${chalk.bold.blue("Usage:")}
    ${chalk.bold.green("npx create-eth<@version>")} ${chalk.gray("[-p <project-name> | --project <project-name>] [--skip | --skip-install] [-s <solidity-framework> | --solidity-framework <solidity-framework>] [-e <extension> | --extension <extension>] [-h | --help]")}
`);
  console.log(` ${chalk.bold.blue("Options:")}
    ${chalk.gray("-p, --project, --name")}         Set project name
    ${chalk.gray("--skip, --skip-install")}       Skip packages installation
    ${chalk.gray("-s, --solidity-framework")}     Choose solidity framework
    ${chalk.gray("-e, --extension")}              Add curated or third-party extension
    ${chalk.gray("-h, --help")}                   Help
    `);
};
