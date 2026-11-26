---
"create-eth": patch
---

foundry: update JS deps in `packages/foundry` (dotenv 18, prettier 3, qrcode 1.5.4, toml 5, shx 0.4, viem instead of ethers), drop unused `envfile`. `checkAccountBalance.js` now uses a viem public client; `generateTsAbis.js` awaits `prettier.format`. Rename `.prettier.json` to `.prettierrc.json` so the intended config applies and format `scripts-js` with it. `checkAccountBalance.js` reads `ALCHEMY_API_KEY` after loading `.env`, so `yarn account` uses the user's key. `foundry.toml`: `polygonAmoy` instead of the dead Mumbai endpoint; remove dead `polygonZkEvm`, zkEVM testnet, `scrollSepolia` and PGN endpoints.

Remove `challenge-state-channels`, `challenge-multisig` and `challenge-svg-nft` from the extensions list: these branches no longer exist in `scaffold-eth/se-2-challenges`, so `-e <name>` failed.
