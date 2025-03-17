import { withDefaults, stringify, deepMerge } from "../../../../templates/utils.js";

const defaultScaffoldConfig = {
    targetNetworks: ["$$chains.mainnet$$"],
    pollingInterval: 30000,
    alchemyApiKey: "$$process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || DEFAULT_ALCHEMY_API_KEY$$",
    walletConnectProjectId: "$$process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '3a8170812b534d0ff9d794f19a901d64'$$",
    onlyLocalBurnerWallet: true,
  };

const contents = ({ preConfigContent, configOverrides, extraConfigTypeName }) => {
  // add solidityFramework network
  const targetNetworks = configOverrides.map(override => override.targetNetworks).flat();
  const extensionConfigOverrides = configOverrides[configOverrides.length - 1] || {};
  if (targetNetworks?.length && Object.keys(extensionConfigOverrides).length > 0) {
    extensionConfigOverrides.targetNetworks = targetNetworks;
  }

  // Merge the default config with any overrides
  const finalConfig = deepMerge(defaultScaffoldConfig, extensionConfigOverrides);

  return  `import * as chains from "viem/chains";

${preConfigContent[0] || ''}

export type BaseConfig = {
  targetNetworks: readonly chains.Chain[];
  pollingInterval: number;
  alchemyApiKey: string;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
};

export type ScaffoldConfig = BaseConfig ${extraConfigTypeName[0] ? `& ${extraConfigTypeName[0]}` : ''};

export const DEFAULT_ALCHEMY_API_KEY = "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";

const scaffoldConfig = ${stringify(finalConfig, {
  targetNetworks: "The networks on which your DApp is live",
  pollingInterval: "The interval at which your front-end polls the RPC servers for new data (it has no effect if you only target the local network (default is 4000))",
  alchemyApiKey: "This is ours Alchemy's default API key.\nYou can get your own at https://dashboard.alchemyapi.io\nIt's recommended to store it in an env variable:\n.env.local for local testing, and in the Vercel/system env config for live apps.",
  walletConnectProjectId: "This is ours WalletConnect's default project ID.\nYou can get your own at https://cloud.walletconnect.com\nIt's recommended to store it in an env variable:\n.env.local for local testing, and in the Vercel/system env config for live apps.",
  onlyLocalBurnerWallet: "Only show the Burner Wallet when running on hardhat network"
})} as const satisfies ScaffoldConfig;

export default scaffoldConfig;`;
};

export default withDefaults(contents, {
  preConfigContent: "",
  extraConfigTypeName: "",
  configOverrides: {},
});
