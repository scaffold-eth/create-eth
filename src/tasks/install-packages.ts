import { DefaultRenderer, ListrTaskWrapper, SimpleRenderer } from "listr2";
import { execaCommand } from "execa";
import chalk from "chalk";

export async function installPackages(
  targetDir: string,
  task: ListrTaskWrapper<any, typeof DefaultRenderer, typeof SimpleRenderer>,
) {
  const execute = execaCommand("yarn install", { cwd: targetDir });

  let outputBuffer: string = "";
  const chunkSize = 1024;

  // Keep only the last `chunkSize` chars and return them as the latest visible line.
  const appendAndGetVisibleOutput = (data: Buffer) => {
    outputBuffer += data.toString();
    if (outputBuffer.length > chunkSize) {
      outputBuffer = outputBuffer.slice(-1 * chunkSize);
    }

    return (
      outputBuffer
        .match(new RegExp(`.{1,${chunkSize}}`, "g"))
        ?.slice(-1)
        .map(chunk => chunk.trimEnd() + "\n")
        .join("") ?? outputBuffer
    );
  };

  execute?.stdout?.on("data", (data: Buffer) => {
    const visibleOutput = appendAndGetVisibleOutput(data);
    task.output = visibleOutput.includes("Link step")
      ? chalk.yellow(`starting link step, this might take a little time...`)
      : visibleOutput;
  });

  execute?.stderr?.on("data", (data: Buffer) => {
    task.output = appendAndGetVisibleOutput(data);
  });

  await execute;
}
