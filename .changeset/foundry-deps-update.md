---
"create-eth": patch
---

foundry: update JS deps in `packages/foundry` (dotenv 18, ethers 6, prettier 3, qrcode 1.5.4, toml 5, shx 0.4), drop unused `envfile`. Port `checkAccountBalance.js` to the ethers v6 API and `generateTsAbis.js` to async `prettier.format`.
