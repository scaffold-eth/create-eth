import { spawnSync } from "child_process";
import { parseFlags, validateNetwork } from "./cliArgs.js";

const { network = "mainnet" } = parseFlags(
  ["network"],
  `
Usage: yarn fork [options]
Options:
  --network <network>   Network from foundry.toml [rpc_endpoints] to fork (default: mainnet)
  --help, -h            Show this help message
Examples:
  yarn fork
  yarn fork --network base
`,
);

validateNetwork(network);

const result = spawnSync("make", ["fork", `FORK_URL=${network}`], { stdio: "inherit" });
process.exit(result.status ?? 1);
