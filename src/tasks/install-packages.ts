import { execa } from "execa";

const INITIAL_PHASE_MAX = 70;
const LINK_PHASE_MAX = 95;
const UPDATE_INTERVAL = 250;

export async function installPackages(targetDir: string, task: { output: string }) {
  let progress = 0;
  let linkPhaseStarted = false;

  const updateProgress = () => {
    const barLength = 30;
    const filledLength = Math.floor((progress / 100) * barLength);
    const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);
    task.output = `Installing packages [${bar}] ${Math.round(progress)}%`;
  };

  const interval = setInterval(() => {
    if (!linkPhaseStarted) {
      const increment = Math.max(0.1, (INITIAL_PHASE_MAX - progress) / 50);
      progress = Math.min(progress + increment, INITIAL_PHASE_MAX);
    } else {
      const increment = Math.max(0.05, (LINK_PHASE_MAX - progress) / 30);
      progress = Math.min(progress + increment, LINK_PHASE_MAX);
    }
    updateProgress();
  }, UPDATE_INTERVAL);

  try {
    const yarnProcess = execa("yarn", ["install"], { cwd: targetDir });

    yarnProcess.stdout?.on("data", (data: Buffer) => {
      const output = data.toString();
      if (output.includes("Link step")) {
        linkPhaseStarted = true;
        progress = INITIAL_PHASE_MAX;
      }
      if (!linkPhaseStarted) {
        progress = Math.min(progress + 0.5, INITIAL_PHASE_MAX);
      } else {
        progress = Math.min(progress + 0.25, LINK_PHASE_MAX);
      }
      updateProgress();
    });

    await yarnProcess;
    clearInterval(interval);
    progress = 100;
    updateProgress();
  } catch (error) {
    clearInterval(interval);
    throw error;
  }
}
