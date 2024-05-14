import { Config, typedQuestion } from "./types";

const config: Config = {
  questions: [
    typedQuestion({
      type: "single-select",
      name: "solidity-framework",
      message: "What solidity framework do you want to use?",
      extensions: ["hardhat", "foundry", null],
      default: "hardhat",
    }),
    typedQuestion({
      type: "multi-select",
      name: "Extension",
      message: "Which extensions do you want to install?",
      extensions: ["subgraph"],
      default: undefined,
    }),
  ],
};
export default config;
