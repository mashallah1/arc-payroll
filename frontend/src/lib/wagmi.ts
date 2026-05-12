import { defineChain } from "viem";
import { http, createConfig } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected(),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "" }),
  ],
  transports: {
    [arcTestnet.id]: http("https://rpc.testnet.arc.network"),
  },
  ssr: true,
});
