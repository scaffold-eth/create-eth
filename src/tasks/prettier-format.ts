import { execa } from "execa";
import path from "path";
import { Options } from "../types";

export async function prettierFormat(targetDir: string, options: Options) {
  try {
    const nextJsPath = path.join(targetDir, "/packages/nextjs");
    const nextPrettierConfig = path.join(nextJsPath, ".prettierrc.json");
    const result = await execa("yarn", [
      "prettier",
      "--write",
      nextJsPath,
      "--config",
      nextPrettierConfig,
      "--plugin=@trivago/prettier-plugin-sort-imports",
    ]);
    if (result.failed) {
      throw new Error("There was a problem running the prettier in nextjs package");
    }

    if (options.extensions.includes("hardhat")) {
      const hardhatPackagePath = path.join(targetDir, "/packages/hardhat");
      const hardhatPrettierConfig = path.join(hardhatPackagePath, ".prettierrc.json");
      const hardhatResult = await execa("yarn", [
        "prettier",
        "--write",
        `${hardhatPackagePath}/*.ts`,
        `${hardhatPackagePath}/deploy/**/*.ts`,
        `${hardhatPackagePath}/scripts/**/*.ts`,
        `${hardhatPackagePath}/test/**/*.ts`,
        `${hardhatPackagePath}/contracts/**/*.sol`,
        "--config",
        hardhatPrettierConfig,
        "--plugin=prettier-plugin-solidity",
      ]);
      if (hardhatResult.failed) {
        throw new Error("There was a problem running prettier in the hardhat package");
      }
    }

    if (options.extensions.includes("foundry")) {
      const foundryPackagePath = path.resolve(targetDir, "packages", "foundry");
      const foundryResult = await execa("forge", ["fmt"], { cwd: foundryPackagePath });
      if (foundryResult.failed) {
        throw new Error("There was a problem running the forge fmt in the foundry package");
      }
    }
  } catch (error) {
    throw new Error("Failed to run prettier", { cause: error });
  }

  return true;
}
