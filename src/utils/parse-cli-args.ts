import arg from "arg";
import type { Args, SolidityFramework } from "../types";
import { SOLIDITY_FRAMEWORKS } from "./consts";

const SOLIDITY_FRAMEWORK_OPTIONS = [...Object.values(SOLIDITY_FRAMEWORKS), "none"];

function solidityFrameworkHandler(value: string) {
  const lowercasedValue = value.toLowerCase();
  if (SOLIDITY_FRAMEWORK_OPTIONS.includes(lowercasedValue)) {
    return lowercasedValue as SolidityFramework | "none";
  }

  // unknown value -> let the user choose from the cli prompts
  return null;
}

export type ParsedCliArgs = {
  skipInstall: boolean | null;
  dev: boolean;
  help: boolean;
  project: string | null;
  extensionName: string | undefined;
  solidityFramework: SolidityFramework | "none" | null;
};

// Pure parsing of raw argv into typed flags. No network, prompts or side effects.
export function parseCliArgs(rawArgs: Args): ParsedCliArgs {
  const args = arg(
    {
      "--skip-install": Boolean,
      "--skip": "--skip-install",

      "--dev": Boolean,

      "--solidity-framework": solidityFrameworkHandler,
      "-s": "--solidity-framework",

      "--extension": String,
      "-e": "--extension",

      "--help": Boolean,
      "-h": "--help",
    },
    {
      argv: rawArgs.slice(2),
    },
  );

  return {
    skipInstall: args["--skip-install"] ?? null,
    dev: args["--dev"] ?? false, // info: use false avoid asking user
    help: args["--help"] ?? false,
    project: args._[0] ?? null,
    extensionName: args["--extension"],
    solidityFramework: args["--solidity-framework"] ?? null,
  };
}
