import { withDefaults } from '../../../utils.js'

const contents = ({ customChains, chainName }) =>
`${customChains.length ? 'import { defineChain } from "viem";\n' : ''}import * as chains from "viem/chains";

export type ScaffoldConfig = {
  targetNetworks: readonly chains.Chain[];
  pollingInterval: number;
  alchemyApiKey: string;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
};

export const DEFAULT_ALCHEMY_API_KEY = "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";
${customChains.length > 0 ? customChains.map(chain => {
  if (chain.name) {  // Ensure chain.name is not undefined or null
    return `
const ${chain.name.toLowerCase().replace(/\s+/g, '')} = defineChain({
  id: ${chain.id},
  name: ${JSON.stringify(chain.name)},
  nativeCurrency: {
    name: ${JSON.stringify(chain.nativeCurrency.name)},
    symbol: ${JSON.stringify(chain.nativeCurrency.symbol)},
    decimals: ${chain.nativeCurrency.decimals}
  },
  rpcUrls: {
    default: {
      http: ${JSON.stringify(chain.rpcUrls.default.http)},
    },
  },
  blockExplorers: {
    default: {
      name: ${JSON.stringify(chain.blockExplorers.default.name)},
      url: ${JSON.stringify(chain.blockExplorers.default.url)},
    },
  },
});
`;
  } else {
    // If chain.name is not defined, return an empty string (no code is generated)
    return '';
  }
}).join('\n') : ''}
const scaffoldConfig = {
  // The networks on which your DApp is live
  targetNetworks: [${chainName.map(chain => `chains.${chain}`).join(', ')}],

  // The interval at which your front-end polls the RPC servers for new data
  // it has no effect if you only target the local network (default is 4000)
  pollingInterval: 30000,

  // This is ours Alchemy's default API key.
  // You can get your own at https://dashboard.alchemyapi.io
  // It's recommended to store it in an env variable:
  // .env.local for local testing, and in the Vercel/system env config for live apps.
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || DEFAULT_ALCHEMY_API_KEY,

  // This is ours WalletConnect's default project ID.
  // You can get your own at https://cloud.walletconnect.com
  // It's recommended to store it in an env variable:
  // .env.local for local testing, and in the Vercel/system env config for live apps.
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",

  // Only show the Burner Wallet when running on hardhat network
  onlyLocalBurnerWallet: true,
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;
`

export default withDefaults(contents, {
  chainName: ['foundry'],
  customChains: [], // No custom chains by default
})
