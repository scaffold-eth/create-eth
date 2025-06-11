import arg from "arg";
import path from "path";
import fs from "fs";
import chalk from "chalk";

const BETA_EXTENSION_DIR = "externalExtensions/create-eth-extensions-beta/extension";
const ARGS_FILE_SUFFIX = ".args.mjs";

const prettyLog = {
  info: (message: string, indent = 0) => console.log(chalk.cyan(`${"  ".repeat(indent)}${message}`)),
  success: (message: string, indent = 0) => console.log(chalk.green(`${"  ".repeat(indent)}✔︎ ${message}`)),
  warning: (message: string, indent = 0) => console.log(chalk.yellow(`${"  ".repeat(indent)}⚠ ${message}`)),
  error: (message: string, indent = 0) => console.log(chalk.red(`${"  ".repeat(indent)}✖ ${message}`)),
  migrate: (message: string, indent = 0) => console.log(chalk.magenta(`${"  ".repeat(indent)}🔄 ${message}`)),
};

const getParsedArgs = (rawArgs: string[]) => {
  const args = arg(
    {
      "--help": Boolean,
      "-h": "--help",
      "--fix": Boolean,
      "--dry-run": Boolean,
    },
    { argv: rawArgs.slice(2) },
  );

  if (args["--help"]) {
    console.log(`
Usage: yarn migrate-to-beta <extension-path> [options]

Arguments:
  extension-path    Path to the extension directory to migrate

Options:
  --help, -h        Show this help message
  --fix             Automatically fix simple issues (e.g., rename args)
  --dry-run         Show what would be changed without making changes

Examples:
  yarn migrate-to-beta externalExtensions/my-extension
  yarn migrate-to-beta externalExtensions/my-extension --fix
  yarn migrate-to-beta externalExtensions/my-extension --dry-run
    `);
    process.exit(0);
  }

  const extensionPath = args._[0];
  if (!extensionPath) {
    throw new Error("Extension path is required. Use --help for usage information.");
  }

  return {
    extensionPath,
    fix: args["--fix"] || false,
    dryRun: args["--dry-run"] || false,
  };
};

interface ArgsComparison {
  currentFile: string;
  betaFile: string;
  currentArgs: Record<string, any>;
  betaArgs: Record<string, any>;
  missingArgs: string[];
  renamedArgs: Array<{ old: string; new: string }>;
  newArgs: string[];
  differentValues: Array<{ arg: string; current: any; beta: any }>;
}

// Known arg renames based on the changelog
const KNOWN_RENAMES = {
  preConfigContent: "preContent",
  extraContent: "extraContents",
  menuIconImports: "preContent", // Header.tsx specific
  menuObjects: "extraMenuLinksObjects", // Header.tsx specific
};

const loadArgsFile = async (filePath: string): Promise<Record<string, any>> => {
  try {
    if (!fs.existsSync(filePath)) {
      return {};
    }

    // Import the args file dynamically
    const absolutePath = path.resolve(filePath);
    const fileUrl = `file://${absolutePath}?t=${Date.now()}`;
    const module = await import(fileUrl);

    // Extract all exports except default
    const args: Record<string, any> = {};
    for (const [key, value] of Object.entries(module)) {
      if (key !== "default") {
        args[key] = value;
      }
    }

    return args;
  } catch (err) {
    prettyLog.error(`Failed to load args file ${filePath}: ${String(err)}`);
    return {};
  }
};

const findAllArgsFiles = async (baseDir: string): Promise<string[]> => {
  const argsFiles: string[] = [];

  const walkDir = async (dir: string) => {
    try {
      const files = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
          await walkDir(fullPath);
        } else if (file.name.endsWith(ARGS_FILE_SUFFIX)) {
          const relativePath = path.relative(baseDir, fullPath);
          argsFiles.push(relativePath);
        }
      }
    } catch {
      // Directory might not exist, skip
    }
  };

  await walkDir(baseDir);
  return argsFiles;
};

const compareArgs = (
  currentArgs: Record<string, any>,
  betaArgs: Record<string, any>,
): {
  missingArgs: string[];
  renamedArgs: Array<{ old: string; new: string }>;
  newArgs: string[];
  differentValues: Array<{ arg: string; current: any; beta: any }>;
} => {
  const currentKeys = new Set(Object.keys(currentArgs));
  const betaKeys = new Set(Object.keys(betaArgs));

  const missingArgs: string[] = [];
  const renamedArgs: Array<{ old: string; new: string }> = [];
  const newArgs: string[] = [];
  const differentValues: Array<{ arg: string; current: any; beta: any }> = [];

  // Check for renamed args
  for (const [oldName, newName] of Object.entries(KNOWN_RENAMES)) {
    if (currentKeys.has(oldName) && betaKeys.has(newName)) {
      renamedArgs.push({ old: oldName, new: newName });
      currentKeys.delete(oldName);
      betaKeys.delete(newName);
    }
  }

  // Check for missing args (exist in beta but not in current)
  for (const betaKey of betaKeys) {
    if (!currentKeys.has(betaKey)) {
      newArgs.push(betaKey);
    }
  }

  // Check for args that exist in current but not in beta
  for (const currentKey of currentKeys) {
    if (!betaKeys.has(currentKey)) {
      missingArgs.push(currentKey);
    }
  }

  // Check for different values in common args
  for (const key of Object.keys(currentArgs)) {
    if (Object.prototype.hasOwnProperty.call(betaArgs, key)) {
      const currentValue = currentArgs[key];
      const betaValue = betaArgs[key];

      if (JSON.stringify(currentValue) !== JSON.stringify(betaValue)) {
        differentValues.push({ arg: key, current: currentValue, beta: betaValue });
      }
    }
  }

  return { missingArgs, renamedArgs, newArgs, differentValues };
};

const generateFixedArgsContent = (
  currentArgs: Record<string, any>,
  betaArgs: Record<string, any>,
  renamedArgs: Array<{ old: string; new: string }>,
): string => {
  const fixedArgs: Record<string, any> = { ...currentArgs };

  // Apply renames
  for (const { old, new: newName } of renamedArgs) {
    if (fixedArgs[old] !== undefined) {
      fixedArgs[newName] = fixedArgs[old];
      delete fixedArgs[old];
    }
  }

  // Add new args from beta (with placeholder values)
  for (const [key, value] of Object.entries(betaArgs)) {
    if (!Object.prototype.hasOwnProperty.call(fixedArgs, key)) {
      fixedArgs[key] = value;
    }
  }

  // Generate the content
  let content = "";
  for (const [key, value] of Object.entries(fixedArgs)) {
    if (typeof value === "string") {
      content += `export const ${key} = ${JSON.stringify(value)};\n\n`;
    } else if (Array.isArray(value)) {
      content += `export const ${key} = ${JSON.stringify(value, null, 2)};\n\n`;
    } else if (typeof value === "object") {
      content += `export const ${key} = ${JSON.stringify(value, null, 2)};\n\n`;
    } else {
      content += `export const ${key} = ${JSON.stringify(value)};\n\n`;
    }
  }

  return content;
};

const analyzeExtension = async (extensionPath: string): Promise<ArgsComparison[]> => {
  const comparisons: ArgsComparison[] = [];

  prettyLog.info("Scanning for .args.mjs files...");

  const currentArgsFiles = await findAllArgsFiles(extensionPath);
  const betaArgsFiles = await findAllArgsFiles(BETA_EXTENSION_DIR);

  // Get all unique relative paths
  const allRelativePaths = new Set([...currentArgsFiles, ...betaArgsFiles]);

  for (const relativePath of allRelativePaths) {
    const currentFile = path.join(extensionPath, relativePath);
    const betaFile = path.join(BETA_EXTENSION_DIR, relativePath);

    const currentArgs = await loadArgsFile(currentFile);
    const betaArgs = await loadArgsFile(betaFile);

    if (Object.keys(currentArgs).length > 0 || Object.keys(betaArgs).length > 0) {
      const comparison = compareArgs(currentArgs, betaArgs);

      comparisons.push({
        currentFile,
        betaFile,
        currentArgs,
        betaArgs,
        ...comparison,
      });
    }
  }

  return comparisons;
};

const reportComparison = (comparison: ArgsComparison, fix: boolean, dryRun: boolean) => {
  const relativePath = path.relative(process.cwd(), comparison.currentFile);
  const fileExists = fs.existsSync(comparison.currentFile);

  if (!fileExists && Object.keys(comparison.betaArgs).length === 0) {
    return; // Skip files that don't exist in either
  }

  console.log(`\n${chalk.bold(relativePath)}`);

  if (!fileExists) {
    prettyLog.warning("File does not exist in current extension", 1);
    prettyLog.info("This file exists in beta version with args:", 1);
    for (const arg of Object.keys(comparison.betaArgs)) {
      prettyLog.info(`• ${arg}`, 2);
    }
    return;
  }

  if (Object.keys(comparison.betaArgs).length === 0) {
    prettyLog.warning("File exists in current but not in beta version", 1);
    return;
  }

  let hasIssues = false;

  if (comparison.renamedArgs.length > 0) {
    hasIssues = true;
    prettyLog.migrate("Renamed arguments:", 1);
    for (const { old, new: newName } of comparison.renamedArgs) {
      prettyLog.info(`${old} → ${newName}`, 2);
    }
  }

  if (comparison.newArgs.length > 0) {
    hasIssues = true;
    prettyLog.warning("New arguments in beta:", 1);
    for (const arg of comparison.newArgs) {
      prettyLog.info(`+ ${arg}`, 2);
    }
  }

  if (comparison.missingArgs.length > 0) {
    hasIssues = true;
    prettyLog.error("Arguments removed in beta:", 1);
    for (const arg of comparison.missingArgs) {
      prettyLog.info(`- ${arg}`, 2);
    }
  }

  if (comparison.differentValues.length > 0) {
    hasIssues = true;
    prettyLog.info("Different values:", 1);
    for (const { arg, current, beta } of comparison.differentValues) {
      prettyLog.info(`${arg}:`, 2);
      prettyLog.info(`Current: ${JSON.stringify(current)}`, 3);
      prettyLog.info(`Beta: ${JSON.stringify(beta)}`, 3);
    }
  }

  if (!hasIssues) {
    prettyLog.success("No issues found", 1);
  } else if (fix && !dryRun) {
    try {
      const fixedContent = generateFixedArgsContent(
        comparison.currentArgs,
        comparison.betaArgs,
        comparison.renamedArgs,
      );

      fs.writeFileSync(comparison.currentFile, fixedContent);
      prettyLog.success("Fixed automatically", 1);
    } catch (err) {
      prettyLog.error(`Failed to fix: ${String(err)}`, 1);
    }
  } else if (fix && dryRun) {
    prettyLog.info("Would fix automatically with --fix (without --dry-run)", 1);
  }
};

const main = async (rawArgs: string[]) => {
  try {
    const { extensionPath, fix, dryRun } = getParsedArgs(rawArgs);

    if (!fs.existsSync(extensionPath)) {
      throw new Error(`Extension path does not exist: ${extensionPath}`);
    }

    if (!fs.existsSync(BETA_EXTENSION_DIR)) {
      throw new Error(`Beta extension directory does not exist: ${BETA_EXTENSION_DIR}`);
    }

    console.log("\n");
    prettyLog.info(`Analyzing extension: ${extensionPath}`);
    prettyLog.info(`Comparing with beta version: ${BETA_EXTENSION_DIR}`);

    if (dryRun) {
      prettyLog.info("Running in dry-run mode - no changes will be made");
    }

    const comparisons = await analyzeExtension(extensionPath);

    if (comparisons.length === 0) {
      prettyLog.warning("No .args.mjs files found to compare");
      return;
    }

    let totalIssues = 0;

    for (const comparison of comparisons) {
      const hasIssues =
        comparison.renamedArgs.length > 0 ||
        comparison.newArgs.length > 0 ||
        comparison.missingArgs.length > 0 ||
        comparison.differentValues.length > 0;

      if (hasIssues) {
        totalIssues++;
      }

      reportComparison(comparison, fix, dryRun);
    }

    console.log("\n");
    prettyLog.info(`Summary: Analyzed ${comparisons.length} files`);

    if (totalIssues === 0) {
      prettyLog.success("🎉 All files are up to date with beta version!");
    } else {
      prettyLog.warning(`${totalIssues} files have migration issues`);

      if (!fix) {
        prettyLog.info("Run with --fix to automatically fix simple issues");
        prettyLog.info("Run with --dry-run to see what changes would be made");
      }
    }
  } catch (err: any) {
    prettyLog.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

main(process.argv).catch(() => process.exit(1));
