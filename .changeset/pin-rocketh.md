---
"create-eth": patch
---

Pin the rocketh packages in the Hardhat template to exact versions (`rocketh` 0.19.20, `@rocketh/node` 0.19.22, `@rocketh/deploy` 0.19.18, `@rocketh/read-execute` 0.19.13, `@rocketh/signer` 0.19.13, `@rocketh/verifier` 0.19.23) so new projects get one consistent set that matches `hardhat-deploy` 2.0.24 instead of mismatched newest versions.
