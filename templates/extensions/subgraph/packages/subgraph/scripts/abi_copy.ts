import * as fs from "fs";
import chalk from "chalk";
import {
  ScaffoldETHGenericContract,
  convertChainIdsKeysToNames,
  deepMergeContracts,
  parseAndCorrectJSON,
} from "../utils/scaffoldETHContracts";

const GRAPH_DIR = "./";

// Scaffold-ETH contracts files
const DEPLOYED_CONTRACTS_FILE = "../nextjs/contracts/deployedContracts.ts";
const EXTERNAL_CONTRACTS_FILE = "../nextjs/contracts/externalContracts.ts";

const readConfigFile = (filePath: string): string => {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (e) {
    console.error(chalk.red(`Error reading file at ${filePath}`), e);
    throw e;
  }
};

const publishContract = (
  contractName: string,
  contractObject: ScaffoldETHGenericContract,
  networkName: string
) => {
  const graphConfigPath = `${GRAPH_DIR}/networks.json`;
  const abisDir = `${GRAPH_DIR}/abis`;
  const configContent = fs.existsSync(graphConfigPath)
    ? fs.readFileSync(graphConfigPath, "utf8")
    : "{}";
  const graphConfig = JSON.parse(configContent);

  graphConfig[networkName] = graphConfig[networkName] || {};
  graphConfig[networkName][contractName] = { address: contractObject.address };

  fs.writeFileSync(graphConfigPath, JSON.stringify(graphConfig, null, 2));

  if (!fs.existsSync(abisDir)) fs.mkdirSync(abisDir);
  fs.writeFileSync(
    `${abisDir}/${networkName}_${contractName}.json`,
    JSON.stringify(contractObject.abi, null, 2)
  );
};

async function main() {
  try {
    const deployedContractsContent = readConfigFile(DEPLOYED_CONTRACTS_FILE);
    const externalContractsContent = readConfigFile(EXTERNAL_CONTRACTS_FILE);

    const deployedContractsMatch = deployedContractsContent.match(
      /const deployedContracts = ({[^;]+}) as const;/s
    );

    // doing global match since we have example comment in extrenalContracts.ts
    const externalContractsRegex =
      /^const\s+externalContracts\s*=\s*({[\s\S]*?})\s*as\s*const;/gm;
    const externalContractsMatches = [
      ...externalContractsContent.matchAll(externalContractsRegex),
    ];

    const deployedContractsStringified = deployedContractsMatch
      ? deployedContractsMatch[1]
      : "{}";

    let externalContractsStringified = "{}";

    if (externalContractsMatches && externalContractsMatches.length > 0) {
      const firstMatch = externalContractsMatches[0];
      if (firstMatch && firstMatch.length > 0 && firstMatch[1]) {
        externalContractsStringified = firstMatch[1];
      }
    }

    if (!deployedContractsStringified || !externalContractsStringified) {
      throw new Error("Failed to find deployedContracts or externalContracts.");
    }

    const deployedContracts = parseAndCorrectJSON(deployedContractsStringified);
    const externalContracts = parseAndCorrectJSON(externalContractsStringified);

    const mergedContracts = deepMergeContracts(
      deployedContracts,
      externalContracts
    );

    // networks.json file uses network names as key instead of chainIds
    const transformedContracts = convertChainIdsKeysToNames(mergedContracts);

    Object.entries(transformedContracts).forEach(([networkName, contracts]) => {
      if (!contracts) {
        console.error(
          chalk.red(`No contracts found for the network: ${networkName}`)
        );
        return;
      }
      Object.entries(contracts).forEach(([contractName, contractObject]) => {
        if (!contractObject || !contractObject.abi || !contractObject.address) {
          console.error(
            chalk.red(
              `Contract ${contractName} does not have an ABI or address. Skipping.`
            )
          );
          return;
        }
        publishContract(contractName, contractObject, networkName);
      });
    });

    console.log(chalk.green("✅ Published contracts to the subgraph package."));
  } catch (error) {
    console.error(chalk.red("An error occurred during the process."), error);
    process.exit(1);
  }
}

main();
