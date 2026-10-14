---
"create-eth": patch
---

foundry: update JS deps in `packages/foundry` (dotenv 18, prettier 3, qrcode 1.5.4, toml 5, shx 0.4, viem instead of ethers), drop unused `envfile`. `checkAccountBalance.js` now uses a viem public client; `generateTsAbis.js` awaits `prettier.format`. Rename `.prettier.json` to `.prettierrc.json` so the intended config applies and format `scripts-js` with it. `foundry.toml`: live mainnet Alchemy host, `polygonAmoy` and `polygonZkEvmCardona` instead of the dead Mumbai / zkEVM testnet endpoints, PGN removed.
