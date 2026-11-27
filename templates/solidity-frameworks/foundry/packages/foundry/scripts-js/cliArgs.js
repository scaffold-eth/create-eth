import { readFileSync } from "fs";
import { dirname, join } from "path";
import { parse } from "toml";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const fail = message => {
  console.error(message);
  process.exit(1);
};

export function parseFlags(flags, usage) {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage);
    process.exit(0);
  }

  const options = {};
  for (let i = 0; i < args.length; i++) {
    const [flag, inlineValue] = args[i].split("=");
    const name = flag.slice(2);
    if (!flag.startsWith("--") || !flags.includes(name)) fail(`🚫️ Unknown argument \`${args[i]}\`\n${usage}`);
    if (inlineValue !== undefined) fail(`🚫️ \`--${name}=<name>\` is not supported. Use \`--${name} <name>\` instead`);
    if (name in options) fail(`🚫️ \`--${name}\` specified more than once\n${usage}`);
    const value = args[++i];
    if (!value || value.startsWith("-")) fail(`🚫️ \`--${name}\` needs a value\n${usage}`);
    options[name] = value;
  }
  return options;
}

export function validateNetwork(network) {
  let parsed;
  try {
    parsed = parse(readFileSync(join(__dirname, "..", "foundry.toml"), "utf-8"));
  } catch (error) {
    fail(`❌ Error reading or parsing foundry.toml: ${error.message}`);
  }
  const endpoints = parsed?.rpc_endpoints;
  if (!endpoints || typeof endpoints !== "object") {
    fail("❌ Missing [rpc_endpoints] section in foundry.toml.");
  }
  const networks = Object.keys(endpoints);
  if (!networks.includes(network)) {
    fail(
      `❌ Network '${network}' not found in foundry.toml [rpc_endpoints].\nAvailable networks: ${networks.join(", ")}`,
    );
  }
}
