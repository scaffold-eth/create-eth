---
"create-eth": patch
---

fix(nextjs-template): stop excluding contracts/ from format script

Users paste ABIs into externalContracts.ts and expect prettier to format on save / yarn format. The contracts/ exclusion was meant for generated deployedContracts.ts but caught externalContracts.ts too.
