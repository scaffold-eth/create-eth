import { withDefaults, stringify, deepMerge } from "../../../../templates/utils.js";

const defaultScaffoldConfig = {
    // The networks on which your DApp is live
    targetNetworks: ["$$chains.mainnet$$"],

    // The interval at which your front-end polls the RPC servers for new data
    // it has no effect if you only target the local network (default is 4000)
    pollingInterval: 30000,
  
    // This is ours Alchemy's default API key.
    // You can get your own at https://dashboard.alchemyapi.io
    // It's recommended to store it in an env variable:
    // .env.local for local testing, and in the Vercel/system env config for live apps.
    alchemyApiKey: "$$process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || DEFAULT_ALCHEMY_API_KEY$$",
  
    // This is ours WalletConnect's default project ID.
    // You can get your own at https://cloud.walletconnect.com
    // It's recommended to store it in an env variable:
    // .env.local for local testing, and in the Vercel/system env config for live apps.
    walletConnectProjectId: "$$process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '3a8170812b534d0ff9d794f19a901d64'$$",
  
    // Only show the Burner Wallet when running on hardhat network
    onlyLocalBurnerWallet: true,
  };

const contents = ({ preConfigContent, configOverrides }) => {
  // add solidityFramework network
  const targetNetworks = configOverrides.map(override => override.targetNetworks).flat();
  const extensionConfigOverrides = configOverrides[configOverrides.length - 1] || {};
  if (targetNetworks?.length && Object.keys(extensionConfigOverrides).length > 0) {
    extensionConfigOverrides.targetNetworks = targetNetworks;
  }

  // Merge the default config with any overrides
  const finalConfig = deepMerge(defaultScaffoldConfig, extensionConfigOverrides);

  return  `import * as chains from "viem/chains";

export type ScaffoldConfig = {
  targetNetworks: readonly chains.Chain[];
  pollingInterval: number;
  alchemyApiKey: string;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
};

export const DEFAULT_ALCHEMY_API_KEY = "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";
${preConfigContent[0] || ''}
;

const scaffoldConfig: ScaffoldConfig = ${stringify(finalConfig)};

export default scaffoldConfig;`;
};

export default withDefaults(contents, {
  preConfigContent: "",
  configOverrides: {},
});
