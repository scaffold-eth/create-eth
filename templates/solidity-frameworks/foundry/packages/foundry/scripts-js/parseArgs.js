import { spawnSync } from "child_process";
import { config } from "dotenv";
import { join } from "path";
import { existsSync } from "fs";
import { parseFlags, validateNetwork } from "./cliArgs.js";
import { selectOrCreateKeystore } from "./selectOrCreateKeystore.js";

config();

const {
  file: fileName = "Deploy.s.sol",
  network = "localhost",
  keystore: keystoreArg,
} = parseFlags(
  ["file", "network", "keystore"],
  `
Usage: yarn deploy [options]
Options:
  --file <filename>     Specify the deployment script file (default: Deploy.s.sol)
  --network <network>   Specify the network (default: localhost)
  --keystore <name>     Specify the keystore account to use (bypasses selection prompt)
  --help, -h           Show this help message
Examples:
  yarn deploy --file DeployYourContract.s.sol --network sepolia
  yarn deploy --network sepolia --keystore my-account
  yarn deploy --file DeployYourContract.s.sol
  yarn deploy
  `,
);

// Function to check if a keystore exists
function validateKeystore(keystoreName) {
  if (keystoreName === "scaffold-eth-default") {
    return true; // Default keystore is always valid
  }

  const keystorePath = join(process.env.HOME, ".foundry", "keystores", keystoreName);
  return existsSync(keystorePath);
}

validateNetwork(network);

if (process.env.LOCALHOST_KEYSTORE_ACCOUNT !== "scaffold-eth-default" && network === "localhost") {
  console.log(`
⚠️ Warning: Using ${process.env.LOCALHOST_KEYSTORE_ACCOUNT} keystore account on localhost.

You can either:
1. Enter the password for ${process.env.LOCALHOST_KEYSTORE_ACCOUNT} account
   OR
2. Set the localhost keystore account in your .env and re-run the command to skip password prompt:
   LOCALHOST_KEYSTORE_ACCOUNT='scaffold-eth-default'
`);
}

let selectedKeystore = process.env.LOCALHOST_KEYSTORE_ACCOUNT;
if (network !== "localhost") {
  if (keystoreArg) {
    // Use the keystore provided via command line argument
    if (!validateKeystore(keystoreArg)) {
      console.log(`\n❌ Error: Keystore '${keystoreArg}' not found!`);
      console.log(`Please check that the keystore exists in ~/.foundry/keystores/`);
      process.exit(1);
    }
    selectedKeystore = keystoreArg;
    console.log(`\n🔑 Using keystore: ${selectedKeystore}`);
  } else {
    try {
      selectedKeystore = await selectOrCreateKeystore();
    } catch (error) {
      console.error("\n❌ Error selecting keystore:", error);
      process.exit(1);
    }
  }
} else if (keystoreArg) {
  // Allow overriding the localhost keystore with --keystore flag
  if (!validateKeystore(keystoreArg)) {
    console.log(`\n❌ Error: Keystore '${keystoreArg}' not found!`);
    console.log(`Please check that the keystore exists in ~/.foundry/keystores/`);
    process.exit(1);
  }
  selectedKeystore = keystoreArg;
  console.log(`\n🔑 Using keystore: ${selectedKeystore} for localhost deployment`);
}

// Check for default account on live network
if (selectedKeystore === "scaffold-eth-default" && network !== "localhost") {
  console.log(`
❌ Error: Cannot deploy to live network using default keystore account!

To deploy to ${network}, please follow these steps:

1. If you haven't generated a keystore account yet:
   $ yarn generate

2. Run the deployment command again.

The default account (scaffold-eth-default) can only be used for localhost deployments.
`);
  process.exit(1);
}

// Set environment variables for the make command
process.env.DEPLOY_SCRIPT = `script/${fileName.replace(/^script\//, "")}`;
process.env.RPC_URL = network;
process.env.ETH_KEYSTORE_ACCOUNT = selectedKeystore;

const result = spawnSync("make", ["deploy-and-generate-abis"], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
