import { defineChain } from "viem";
import { http, createConfig } from "wagmi";
import { metaMask, coinbaseWallet } from "wagmi/connectors";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});

export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [
    metaMask(),
    coinbaseWallet({ appName: "Arc Payroll" }),
  ],
  transports: {
    [arcTestnet.id]: http("https://rpc.testnet.arc.network"),
  },
  ssr: true,
});
