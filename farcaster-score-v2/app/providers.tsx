"use client";

import * as React from "react";
import { WagmiProvider, createConfig, fallback, http } from "wagmi";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";

const baseRpc = process.env.NEXT_PUBLIC_BASE_RPC_URL;

const wagmiConfig = createConfig({
  chains: [base],
  connectors: [farcasterMiniApp()],
  transports: {
    [base.id]: fallback([
      ...(baseRpc ? [http(baseRpc)] : []),
      http("https://mainnet.base.org"),
      http("https://base.llamarpc.com"),
    ])
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
