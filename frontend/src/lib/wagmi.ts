import { http } from "wagmi";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

// BOT Chain Testnet (Bohr Testnet) - chainId 968
export const botChainTestnet = {
  id: 968,
  name: "BOT Chain Testnet",
  network: "bot-chain-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "BOT",
    symbol: "BOT",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.bohr.life"],
    },
    public: {
      http: ["https://rpc.bohr.life"],
    },
  },
  blockExplorers: {
    default: {
      name: "BOTScan",
      url: "https://scan.bohr.life",
    },
  },
  testnet: true,
} as const;

export const config = getDefaultConfig({
  appName: "Botter",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
  chains: [botChainTestnet],
  transports: {
    [botChainTestnet.id]: http(
      process.env.NEXT_PUBLIC_BOT_CHAIN_RPC || "https://rpc.bohr.life"
    ),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
