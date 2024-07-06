import arg from 'arg';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { execa } from 'execa';
import ncp from 'ncp';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const SOLIDITY_FRAMEWORKS = {
    HARDHAT: "hardhat",
    FOUNDRY: "foundry",
};

const EXTERNAL_EXTENSIONS_DIR = "externalExtensions";
const TARGET_EXTENSION_DIR = "extension";
const TEMPLATE_FILE_SUFFIX = ".template.mjs";
const BASE_PATH = "base";
const SOLIDITY_FRAMEWORKS_PATH = "solidity-frameworks";
const DEPLOYED_CONTRACTS_FILE = "deployedContracts.ts";
const YARN_LOCK_FILE = "yarn.lock";
const prettyLog = {
    info: (message, indent = 0) => console.log(chalk.cyan(`${"  ".repeat(indent)}${message}`)),
    success: (message, indent = 0) => console.log(chalk.green(`${"  ".repeat(indent)}✔ ${message}`)),
    warning: (message, indent = 0) => console.log(chalk.yellow(`${"  ".repeat(indent)}⚠ ${message}`)),
    error: (message, indent = 0) => console.log(chalk.red(`${"  ".repeat(indent)}✖ ${message}`)),
};
const ncpPromise = promisify(ncp);
const currentFileUrl = import.meta.url;
const templateDirectory = path.resolve(decodeURI(fileURLToPath(currentFileUrl)), "../../templates");
const parseArguments = (rawArgs) => {
    const args = arg({}, { argv: rawArgs.slice(2) });
    const projectPath = args._[0];
    if (!projectPath) {
        throw new Error("Project path is required");
    }
    return { projectPath };
};
const getChangedFilesFromFirstCommit = async (projectPath) => {
    const { stdout: firstCommit } = await execa("git", ["rev-list", "--max-parents=0", "HEAD"], {
        cwd: projectPath,
    });
    const { stdout } = await execa("git", ["diff", "--name-only", `${firstCommit.trim()}..HEAD`], {
        cwd: projectPath,
    });
    return stdout.split("\n").filter(Boolean);
};
const getChangedFiles = async (projectPath) => {
    return getChangedFilesFromFirstCommit(projectPath);
};
const createDirectories = async (filePath, projectName) => {
    const dirPath = path.join(EXTERNAL_EXTENSIONS_DIR, projectName, TARGET_EXTENSION_DIR, path.dirname(filePath));
    await fs.promises.mkdir(dirPath, { recursive: true });
};
const findTemplateFiles = async (dir, templates) => {
    const files = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            await findTemplateFiles(fullPath, templates);
        }
        else if (file.name.endsWith(TEMPLATE_FILE_SUFFIX)) {
            let relativePath = path.relative(templateDirectory, fullPath).replace(new RegExp(`${TEMPLATE_FILE_SUFFIX}$`), "");
            const pathSegments = relativePath.split(path.sep);
            // Normalize the relative path by stripping the initial parts
            if (pathSegments[0] === BASE_PATH) {
                relativePath = pathSegments.slice(1).join(path.sep);
            }
            else if (pathSegments[0] === SOLIDITY_FRAMEWORKS_PATH) {
                const framework = pathSegments[1];
                if (Object.values(SOLIDITY_FRAMEWORKS).includes(framework)) {
                    relativePath = pathSegments.slice(2).join(path.sep);
                }
            }
            templates.add(relativePath);
        }
    }
};
const copyFiles = async (files, projectName, projectPath, templates) => {
    for (const file of files) {
        const sourcePath = path.resolve(projectPath, file);
        const destPath = path.join(EXTERNAL_EXTENSIONS_DIR, projectName, TARGET_EXTENSION_DIR, file);
        if (templates.has(file)) {
            prettyLog.warning(`Skipping file: ${file}`, 2);
            prettyLog.info(`Please instead create/update: ${destPath}.args.mjs`, 3);
            continue;
        }
        const sourceFileName = path.basename(sourcePath);
        if (sourceFileName === DEPLOYED_CONTRACTS_FILE) {
            prettyLog.warning(`Skipping file: ${file}`, 2);
            prettyLog.info(`${sourceFileName} can be generated using \`yarn deploy\``, 3);
            continue;
        }
        if (sourceFileName === YARN_LOCK_FILE) {
            prettyLog.warning(`Skipping file: ${file}`, 2);
            prettyLog.info(`${file} will be generated when doing \`yarn install\` `, 3);
            continue;
        }
        await createDirectories(file, projectName);
        await ncpPromise(sourcePath, destPath);
        prettyLog.success(`Copied: ${file}`, 2);
    }
};
const main = async (rawArgs) => {
    try {
        const { projectPath } = parseArguments(rawArgs);
        const projectName = path.basename(projectPath);
        const templates = new Set();
        await findTemplateFiles(templateDirectory, templates);
        console.log("\n");
        prettyLog.info(`Extension name: ${projectName}\n`);
        prettyLog.info("Getting list of changed files...", 1);
        const changedFiles = await getChangedFiles(projectPath);
        if (changedFiles.length === 0) {
            prettyLog.warning("No changed files to copy.", 1);
        }
        else {
            prettyLog.info(`Found ${changedFiles.length} changed files, copying them...`, 1);
            await copyFiles(changedFiles, projectName, projectPath, templates);
        }
        console.log("\n");
        prettyLog.info(`Files processed successfully, updated ${EXTERNAL_EXTENSIONS_DIR}/${projectName} directory.`);
    }
    catch (err) {
        prettyLog.error(`Error: ${err.message}`);
    }
};
main(process.argv).catch(() => process.exit(1));
//# sourceMappingURL=create-extension.js.map