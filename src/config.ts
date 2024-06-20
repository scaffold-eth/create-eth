import { Config, ExternalExtension, typedQuestion } from "./types";

const config: Config = {
  questions: [
    typedQuestion({
      type: "single-select",
      name: "solidityFramework",
      message: "What solidity framework do you want to use?",
      extensions: ["hardhat", "foundry", null],
      default: "hardhat",
    }),
  ],
};

const CURATED_EXTENSIONS: { [key: string]: ExternalExtension } = {
  subgraph: {
    repository: "https://github.com/scaffold-eth/create-eth-extensions",
    branch: "subgraph",
  },
  "eip-712": {
    repository: "https://github.com/scaffold-eth/create-eth-extensions",
    branch: "eip-712",
  },
};

export { config, CURATED_EXTENSIONS };
