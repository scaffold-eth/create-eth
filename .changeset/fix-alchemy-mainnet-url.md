---
"create-eth": patch
---

Use Alchemy's current `eth-mainnet.g.alchemy.com` host for the mainnet RPC in the Hardhat and Foundry templates. The old `eth-mainnet.alchemyapi.io` host no longer resolves, so `yarn fork` failed in new projects.
