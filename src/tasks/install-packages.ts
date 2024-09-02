import { execa } from "execa";

const UPDATE_INTERVAL = 250; // Update every 250ms
const TOTAL_DURATION = 60000; // Estimate 60 seconds for installation
const FINAL_UPDATE_INTERVAL = 10; // Update every 10ms for the final stretch

export async function installPackages(targetDir: string, task: { output: string }) {
  let progress = 0;
  let intervalId: NodeJS.Timeout | null = null;

  const updateProgress = (increment: number) => {
    progress = Math.min(progress + increment, 100);
    const barLength = 30;
    const filledLength = Math.floor((progress / 100) * barLength);
    const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);
    task.output = `Installing packages [${bar}] ${Math.round(progress)}%`;
  };

  const startProgressBar = () => {
    const totalSteps = TOTAL_DURATION / UPDATE_INTERVAL;
    const incrementPerStep = 100 / totalSteps;
    
    intervalId = setInterval(() => {
      updateProgress(incrementPerStep);
      if (progress >= 100) {
        clearInterval(intervalId!);
      }
    }, UPDATE_INTERVAL);
  };

  try {
    const yarnProcess = execa("yarn", ["install"], { cwd: targetDir });
    startProgressBar();

    await yarnProcess;
    
    if (intervalId) clearInterval(intervalId);
    while (progress < 100) {
      await new Promise(resolve => setTimeout(resolve, FINAL_UPDATE_INTERVAL));
      updateProgress(1);
    }
  } catch (error) {
    if (intervalId) clearInterval(intervalId);
    throw error;
  }
}
