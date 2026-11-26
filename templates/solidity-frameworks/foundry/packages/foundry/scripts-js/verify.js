import { spawnSync } from "child_process";
import { existsSync, readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { parseFlags, validateNetwork } from "./cliArgs.js";

const { network = "localhost", file = "Deploy.s.sol" } = parseFlags(
  ["network", "file"],
  `
Usage: yarn verify [options]
Options:
  --network <network>   Network from foundry.toml [rpc_endpoints] to verify on (default: localhost)
  --file <filename>     Deployment script whose broadcast to verify (default: Deploy.s.sol)
  --help, -h            Show this help message
Examples:
  yarn verify --network sepolia
  yarn verify --network sepolia --file DeployYourContract.s.sol
`,
);

validateNetwork(network);

const scriptName = file.replace(/^script\//, "");
const broadcastDir = join(dirname(fileURLToPath(import.meta.url)), "..", "broadcast");

const getChainIds = dir =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && existsSync(join(dir, entry.name, "run-latest.json")))
        .map(entry => entry.name)
    : [];

if (getChainIds(join(broadcastDir, scriptName)).length === 0) {
  const deployedScripts = existsSync(broadcastDir)
    ? readdirSync(broadcastDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => ({ name: entry.name, chains: getChainIds(join(broadcastDir, entry.name)) }))
        .filter(entry => entry.chains.length > 0)
    : [];
  console.error(
    `❌ No broadcast found for ${scriptName}. Deploy it first with \`yarn deploy --network ${network} --file ${scriptName}\`.`,
  );
  if (deployedScripts.length > 0) {
    console.error("Deployed scripts found in broadcast/:");
    deployedScripts.forEach(({ name, chains }) => console.error(`  ${name} (chain IDs: ${chains.join(", ")})`));
    console.error("Re-run with `--file <Script.s.sol>` for a script deployed to this network.");
  }
  process.exit(1);
}

process.env.DEPLOY_SCRIPT = `script/${scriptName}`;

const result = spawnSync("make", ["verify", `RPC_URL=${network}`], { stdio: "inherit" });
process.exit(result.status ?? 1);
