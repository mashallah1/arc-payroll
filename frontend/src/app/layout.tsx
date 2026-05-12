// @ts-nocheck
import type { Metadata } from "next";
import { Web3Provider } from "@/providers/Web3Provider";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Arc Payroll — Trustless Global Payroll on Arc Testnet",
  description:
    "Pay anyone, anywhere, in their local stablecoin. Powered by Arc blockchain. USDC-native. Sub-second settlement.",
  openGraph: {
    title: "Arc Payroll",
    description: "Trustless global payroll on Arc Testnet",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
