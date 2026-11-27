---
"create-eth": minor
---

foundry: `yarn deploy`, `yarn fork` and `yarn verify` now reject arguments they can't use instead of silently falling back to `localhost`/`mainnet`. `--network=<name>`, stray positional args (`yarn fork base`), unknown flags, missing values and networks missing from `foundry.toml` `[rpc_endpoints]` exit 1 with a clear message. `yarn fork` and `yarn verify` accept `--network <name>` and `--help`. `yarn verify --file <Script.s.sol>` verifies the broadcast of a specific deploy script (default `Deploy.s.sol`), and lists the deployed scripts when the broadcast is missing. `yarn deploy` to a live network with the default keystore now exits 1.

Raise the minimum Node.js version to 22.13.0 in the CLI check, the generated `package.json` `engines` and the README.
