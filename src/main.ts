import { copyTemplateFiles, createProjectDirectory, createFirstGitCommit, prettierFormat } from "./tasks";
import { execaCommand as command } from "execa";
import type { Options } from "./types";
import { renderOutroMessage } from "./utils/render-outro-message";
import chalk from "chalk";
import { Listr } from "listr2";
import path from "path";
import { fileURLToPath } from "url";
import { getArgumentFromExternalExtensionOption } from "./utils/external-extensions";
import { SOLIDITY_FRAMEWORKS } from "./utils/consts";

export async function createProject(options: Options) {
  console.log(`\n`);

  const currentFileUrl = import.meta.url;

  const templateDirectory = path.resolve(decodeURI(fileURLToPath(currentFileUrl)), "../../templates");

  const targetDirectory = path.resolve(process.cwd(), options.project);

  const tasks = new Listr(
    [
      {
        title: `📁 Create project directory ${targetDirectory}`,
        task: () => createProjectDirectory(options.project),
      },
      {
        title: `🚀 Creating a new Scaffold-ETH 2 app in ${chalk.green.bold(
          options.project,
        )}${options.externalExtension ? ` with the ${chalk.green.bold(options.dev ? options.externalExtension : getArgumentFromExternalExtensionOption(options.externalExtension))} extension` : ""}`,
        task: () => copyTemplateFiles(options, templateDirectory, targetDirectory),
      },
      {
        title: "📦 Installing dependencies with yarn, this could take a while",
        task: async (_, task): Promise<void> => {
          const execute = command("yarn install", { cwd: targetDirectory });

          let outputBuffer: string = ""; // Buffer to store output characters

          const maxChunks = 1; // Define the number of chunks to display
          const chunkSize = 1024; // Define the size of each chunk (1KB here)

          // Handle stdout
          execute?.stdout?.on("data", (data: Buffer) => {
            outputBuffer += data.toString(); // Append data to the buffer

            // Ensure the buffer doesn't exceed the size of maxChunks * chunkSize
            if (outputBuffer.length > maxChunks * chunkSize) {
              outputBuffer = outputBuffer.slice(-maxChunks * chunkSize); // Keep only the last N chunks
            }

            // Add a forced newline if needed (this makes it friendly to Listr2)
            const visibleOutput =
              outputBuffer
                .match(new RegExp(`.{1,${chunkSize}}`, "g")) // Split into chunks
                ?.slice(-maxChunks) // Keep only the last N chunks
                .map(chunk => chunk.trimEnd() + "\n") // Ensure each chunk ends with a newline
                .join("") ?? outputBuffer;

            task.output = visibleOutput; // Set the trimmed and formatted output
          });

          // Handle stderr similarly
          execute?.stderr?.on("data", (data: Buffer) => {
            outputBuffer += data.toString();

            if (outputBuffer.length > maxChunks * chunkSize) {
              outputBuffer = outputBuffer.slice(-maxChunks * chunkSize);
            }

            const visibleOutput =
              outputBuffer
                .match(new RegExp(`.{1,${chunkSize}}`, "g")) // Split into chunks
                ?.slice(-maxChunks)
                .map(chunk => chunk.trimEnd() + "\n") // Force a newline at the end of each chunk
                .join("") ?? outputBuffer;

            task.output = visibleOutput;
          });

          await execute;
        },
        skip: () => {
          if (!options.install) {
            return "Manually skipped, since `--skip-install` flag was passed";
          }
          return false;
        },

        rendererOptions: {
          outputBar: 8, // Optional, adjust for your needs
          persistentOutput: false,
        },
      },
      /* {
        title: `📦 Installing dependencies with yarn, this could take a while`,
        task: () => installPackages(targetDirectory),
        skip: () => {
          if (!options.install) {
            return "Manually skipped, since `--skip-install` flag was passed";
          }
          return false;
        },
      }, */
      {
        title: "🪄 Formatting files",
        task: () => prettierFormat(targetDirectory),
        skip: () => {
          if (!options.install) {
            return "Can't use source prettier, since `yarn install` was skipped";
          }
          return false;
        },
      },
      {
        title: `📡 Initializing Git repository${options.solidityFramework === SOLIDITY_FRAMEWORKS.FOUNDRY ? " and submodules" : ""}`,
        task: () => createFirstGitCommit(targetDirectory, options),
      },
    ],
    { rendererOptions: { collapseSkips: false, suffixSkips: true } },
  );

  try {
    await tasks.run();
    renderOutroMessage(options);
  } catch (error) {
    console.log("%s Error occurred", chalk.red.bold("ERROR"), error);
    console.log("%s Exiting...", chalk.red.bold("Uh oh! 😕 Sorry about that!"));
  }
}
