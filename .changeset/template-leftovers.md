---
"create-eth": patch
---

Remove template leftovers: delete the unused `fetchPriceFromUniswap.ts` helper, run plain `husky` in `postinstall` instead of the deprecated `husky install`, and make the generated README show the same minimum Node version as the project's `engines.node` (22.10.0 for Hardhat).
