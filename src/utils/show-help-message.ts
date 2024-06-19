import chalk from "chalk";

export const showHelpMessage = () => {
  console.log(` ${chalk.bold.blue("Usage:")}
    ${chalk.bold.green("npx create-eth<@version>")} ${chalk.gray("[-i | --install | -s | --skip | --skip-install] [-e <extension> | --extension <extension>] [--dev] [-h | --help]")}
`);
  console.log(` ${chalk.bold.blue("Options:")}
    ${chalk.gray("-i, --install")}               Install packages
    ${chalk.gray("-s, --skip, --skip-install")}  Skip packages installation
    ${chalk.gray("-e, --extension")}             Add curated or third-party extension
    ${chalk.gray("--dev")}                       Developer mode
    ${chalk.gray("-h, --help")}                  Help
    `);
};
