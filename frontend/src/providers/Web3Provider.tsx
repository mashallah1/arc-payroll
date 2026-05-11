"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { wagmiConfig, projectId, arcTestnet } from "@/lib/wagmi";

// ─── AppKit (Reown) setup ─────────────────────────────────────────────────────
// This gives us the full wallet picker modal — detects all installed extensions,
// shows QR code for mobile wallets, works in Brave/Chrome/Firefox.

const wagmiAdapter = new WagmiAdapter({
  networks: [arcTestnet],
  projectId,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [arcTestnet],
  projectId,
  metadata: {
    name: "Arc Payroll",
    description: "Trustless global payroll on Arc. Pay workers in their local currency, settled in under a second.",
    url: typeof window !== "undefined" ? window.location.origin : "https://localhost:3000",
    icons: ["https://avatars.githubusercontent.com/u/179229932"],
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#1a1a1a",
    "--w3m-border-radius-master": "4px",
  },
});

// ─── Query client ─────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      refetchInterval: 15_000,
      retry: 2,
    },
  },
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
