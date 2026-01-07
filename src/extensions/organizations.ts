import { Extension } from "./types";

export const organizations: Extension[] = [
  {
    extensionFlagValue: "metamask/erc-7715-extension",
    name: "MetaMask Advanced Permissions",
    description: "This extension helps you get started with MetaMask Advanced Permissions (ERC-7715).",
    repository: "https://github.com/MetaMask/erc-7715-extension",
  },
  {
    extensionFlagValue: "metamask/gator-extension",
    name: "Smart Accounts Kit",
    description: "This extension helps you get started with MetaMask Smart Accounts, and ERC-7710 delegations.",
    repository: "https://github.com/MetaMask/gator-extension",
  },
  {
    extensionFlagValue: "signinwithethereum/scaffold-siwe-ext",
    name: "SIWE Extension",
    description:
      "This extension helps you get started with SIWE (Sign-In with Ethereum). Authenticate using your Ethereum wallet. No passwords needed.",
    repository: "https://github.com/signinwithethereum/scaffold-siwe-ext",
  },
];
