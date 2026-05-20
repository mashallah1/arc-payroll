"use client";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected, walletConnect } from "wagmi/connectors";
import { defineChain } from "viem";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
});

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

const config = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [arcTestnet.id]: http("https://rpc.testnet.arc.network", {
      batch: false,
      timeout: 30_000,
      retryCount: 2,
    }),
  },
  ssr: false,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1500,
      staleTime: 15_000,
      gcTime: 60_000,
      refetchOnWindowFocus: false,
      networkMode: "always",
    },
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
