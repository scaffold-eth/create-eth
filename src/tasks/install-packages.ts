import { execa } from "execa";

const FAST_INTERVAL = 1500; 
const SLOW_INTERVAL = 2500; 
const VERY_SLOW_INTERVAL = 3500; 
const FINAL_UPDATE_INTERVAL = 10;

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
    let currentInterval = FAST_INTERVAL;
    let incrementPerStep = 0.5;

    intervalId = setInterval(() => {
      updateProgress(incrementPerStep);
      
      if (progress >= 50 && currentInterval === FAST_INTERVAL) {
        clearInterval(intervalId!);
        currentInterval = SLOW_INTERVAL;
        incrementPerStep = 0.2;
        intervalId = setInterval(() => updateProgress(incrementPerStep), currentInterval);
      } else if (progress >= 70 && currentInterval === SLOW_INTERVAL) {
        clearInterval(intervalId!);
        currentInterval = VERY_SLOW_INTERVAL;
        incrementPerStep = 0.1;
        intervalId = setInterval(() => updateProgress(incrementPerStep), currentInterval);
      }

      if (progress >= 100) {
        clearInterval(intervalId!);
      }
    }, currentInterval);
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
