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
    },
    { argv: rawArgs.slice(2) },
  );

  if (args["--help"]) {
    console.log(`
Usage: yarn migrate-to-beta <extension-base-path>

Arguments:
  extension-base-path    Path to the extension directory (script will automatically look for /extension subdirectory)

Options:
  --help, -h             Show this help message

Examples:
  yarn migrate-to-beta externalExtensions/my-extension
  yarn migrate-to-beta externalExtensions/se-2-challenges
    `);
    process.exit(0);
  }

  const basePath = args._[0];
  if (!basePath) {
    throw new Error("Extension path is required. Use --help for usage information.");
  }

  // Automatically append /extension to the path
  const extensionPath = path.join(basePath, "extension");

  return {
    extensionPath,
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
} => {
  const currentKeys = new Set(Object.keys(currentArgs));
  const betaKeys = new Set(Object.keys(betaArgs));

  const missingArgs: string[] = [];
  const renamedArgs: Array<{ old: string; new: string }> = [];
  const newArgs: string[] = [];

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

  return { missingArgs, renamedArgs, newArgs };
};

const analyzeExtension = async (extensionPath: string): Promise<ArgsComparison[]> => {
  const comparisons: ArgsComparison[] = [];

  prettyLog.info("Scanning for .args.mjs files...");

  const currentArgsFiles = await findAllArgsFiles(extensionPath);

  // Only process files that exist in the current extension
  for (const relativePath of currentArgsFiles) {
    const currentFile = path.join(extensionPath, relativePath);
    const betaFile = path.join(BETA_EXTENSION_DIR, relativePath);

    const currentArgs = await loadArgsFile(currentFile);
    const betaArgs = await loadArgsFile(betaFile);

    if (Object.keys(currentArgs).length > 0) {
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

const reportComparison = (comparison: ArgsComparison) => {
  const relativePath = path.relative(process.cwd(), comparison.currentFile);

  console.log(`\n${chalk.bold(relativePath)}`);

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

  if (!hasIssues) {
    prettyLog.success("No issues found", 1);
  }
};

const main = async (rawArgs: string[]) => {
  try {
    const { extensionPath } = getParsedArgs(rawArgs);

    if (!fs.existsSync(extensionPath)) {
      throw new Error(`Extension path does not exist: ${extensionPath}`);
    }

    if (!fs.existsSync(BETA_EXTENSION_DIR)) {
      throw new Error(`Beta extension directory does not exist: ${BETA_EXTENSION_DIR}`);
    }

    console.log("\n");
    prettyLog.info(`Analyzing extension: ${extensionPath}`);
    prettyLog.info(`Comparing with beta version: ${BETA_EXTENSION_DIR}`);

    const comparisons = await analyzeExtension(extensionPath);

    if (comparisons.length === 0) {
      prettyLog.warning("No .args.mjs files found to compare");
      return;
    }

    let totalIssues = 0;

    // Sort comparisons by priority: no issues first, then only new args, then other issues
    const getPriority = (comparison: ArgsComparison): number => {
      const hasRenamed = comparison.renamedArgs.length > 0;
      const hasNew = comparison.newArgs.length > 0;
      const hasMissing = comparison.missingArgs.length > 0;

      if (!hasRenamed && !hasNew && !hasMissing) return 0; // No issues
      if (hasNew && !hasRenamed && !hasMissing) return 1; // Only new args
      return 2; // Other issues (renamed, missing, or mixed)
    };

    const sortedComparisons = comparisons.sort((a, b) => {
      return getPriority(a) - getPriority(b);
    });

    for (const comparison of sortedComparisons) {
      const hasIssues =
        comparison.renamedArgs.length > 0 || comparison.newArgs.length > 0 || comparison.missingArgs.length > 0;

      if (hasIssues) {
        totalIssues++;
      }

      reportComparison(comparison);
    }

    console.log("\n");
    prettyLog.info(`Summary: Analyzed ${comparisons.length} files`);

    if (totalIssues === 0) {
      prettyLog.success("🎉 All files are up to date with beta version!");
    } else {
      prettyLog.warning(`${totalIssues} files have migration issues`);
      prettyLog.info("Review the output above for detailed migration guidance");
    }
  } catch (err: any) {
    prettyLog.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

main(process.argv).catch(() => process.exit(1));
