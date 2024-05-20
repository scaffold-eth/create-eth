import type { Args, RawOptions } from "../types";
import arg from "arg";
import * as https from "node:https";
import { getDataFromTemplateArgument } from "./third-party-templates";
import chalk from "chalk";

const validateTemplate = async (
  template: string
): Promise<{ repository: string; branch?: string }> => {
  const { githubUrl, githubBranchUrl, branch } = getDataFromTemplateArgument(template);

  await new Promise((resolve, reject) => {
    https
      .get(githubBranchUrl, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Template not found: ${githubUrl}`));
        } else {
          resolve(null);
        }
      })
      .on("error", (err) => {
        reject(err);
      });
  });

  return { repository: githubUrl, branch };
};

// TODO update smartContractFramework code with general extensions
export async function parseArgumentsIntoOptions(
  rawArgs: Args
): Promise<RawOptions> {
  const args = arg(
    {
      "--install": Boolean,
      "-i": "--install",

      "--skip-install": Boolean,
      "--skip": "--skip-install",
      "-s": "--skip-install",

      "--dev": Boolean,

      "--template": String,
      "-t": "--template",
    },
    {
      argv: rawArgs.slice(2).map((a) => a.toLowerCase()),
    }
  );

  const install = args["--install"] ?? null;
  const skipInstall = args["--skip-install"] ?? null;
  const hasInstallRelatedFlag = install || skipInstall;

  const dev = args["--dev"] ?? false; // info: use false avoid asking user

  const project = args._[0] ?? null;

  const template = args["--template"]
    ? await validateTemplate(args["--template"])
    : null;

  if (template) {
    console.log(chalk.yellow(` Your are using a third-party template. Make sure you trust the source of ${chalk.yellow.bold(template.repository)}`));
  }

  console.log("");

  return {
    project,
    install: hasInstallRelatedFlag ? install || !skipInstall : null,
    dev,
    extensions: null, // TODO add extensions flags
    template,
  };
}
