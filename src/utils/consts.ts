import { SolidityFramework } from "../types";

export const baseDir = "base";

export const SOLIDITY_FRAMEWORKS = {
  HARDHAT: "hardhat",
  FOUNDRY: "foundry",
} as const;

export const isSolidityFramework = (value: string): value is SolidityFramework => {
  return Object.values(SOLIDITY_FRAMEWORKS).includes(value as SolidityFramework);
};
