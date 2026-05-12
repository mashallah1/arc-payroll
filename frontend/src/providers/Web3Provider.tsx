"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defineChain } from "viem";
import { injected, walletConnect } from "wagmi/connectors";

const arcTestnet = defineChain({
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

const config = createConfig({
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000, refetchInterval: 15_000, retry: 2 },
  },
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
