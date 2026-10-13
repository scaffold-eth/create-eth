---
"create-eth": patch
---

Skip local simulation for non-localhost Foundry deploys so gas limits come from the node's eth_estimateGas. Fixes out-of-gas deploy failures on Sepolia after the Glamsterdam fork repriced state creation (EIP-8037).
