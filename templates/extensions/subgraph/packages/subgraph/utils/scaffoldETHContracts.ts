import { NETWORKS_NAMES } from "./networks_names";

export type ScaffoldETHGenericContract = {
  address: string;
  abi: any[];
};

export type ScaffoldETHGenericContractsDeclaration = {
  [chainId: number]: {
    [contractName: string]: ScaffoldETHGenericContract;
  };
};

export type NetworksJson = {
  [chainName: string]: {
    [contractName: string]: ScaffoldETHGenericContract;
  };
};

export const deepMergeContracts = (
  local: ScaffoldETHGenericContractsDeclaration,
  external: ScaffoldETHGenericContractsDeclaration
) => {
  const result: Record<PropertyKey, any> = {};
  const allKeys = Array.from(
    new Set([...Object.keys(external), ...Object.keys(local)])
  );
  for (const keyString of allKeys) {
    const key = Number(keyString);
    if (!external[key]) {
      result[key] = local[key];
      continue;
    }
    const amendedExternal = Object.fromEntries(
      Object.entries(
        external[key] as Record<string, Record<string, unknown>>
      ).map(([contractName, declaration]) => [
        contractName,
        { ...declaration, external: true },
      ])
    );
    result[key] = { ...local[key], ...amendedExternal };
  }
  return result as ScaffoldETHGenericContractsDeclaration;
};

export const convertChainIdsKeysToNames = (
  deployedContracts: ScaffoldETHGenericContractsDeclaration
) => {
  const result: Record<string, any> = {};

  for (const keyString in deployedContracts) {
    const key = Number(keyString) as keyof typeof NETWORKS_NAMES;
    const chainName = key in NETWORKS_NAMES ? NETWORKS_NAMES[key] : undefined;
    if (!chainName) {
      console.error(`No chain name found for chain ID ${key}. Skipping...`);
      continue;
    }
    result[chainName] = deployedContracts[key];
  }

  return result as NetworksJson;
};

export const parseAndCorrectJSON = (input: string): any => {
  // Add double quotes around keys
  let correctedJSON = input.replace(/(\w+)(?=\s*:)/g, '"$1"');

  // Remove trailing commas
  correctedJSON = correctedJSON.replace(/,(?=\s*[}\]])/g, "");

  try {
    return JSON.parse(correctedJSON);
  } catch (error) {
    console.error("Failed to parse JSON", error);
    throw new Error("Failed to parse JSON");
  }
};
