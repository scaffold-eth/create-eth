import { Extension } from "./types";

export const organizations: Extension[] = [
  {
    extensionFlagValue: "gator",
    name: "Delegation Toolkit Extension",
    description:
      "The MetaMask Delegation Toolkit is a Viem-based collection of tools for integrating embedded smart accounts, known as MetaMaskSmartAccount, into dapps. Developers can create and manage delegator accounts that delegate specific permissions, such as spending limits or time-based access, to other accounts. This extension demonstrates the end-to-end flow for initializing a MetaMask Smart Account, generating and signing a delegation, and redeeming the delegation according to [ERC-7710](https://eips.ethereum.org/EIPS/eip-7710) specifications.",
    repository: "https://github.com/MetaMask/gator-extension",
    installCommand: "npx create-eth@latest -e metamask/gator-extension",
  },
];
