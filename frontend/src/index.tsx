import { createRoot } from "react-dom/client";
import "./index.css";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import { ThemeProvider } from "./components/theme-provider";
const container = document.getElementById("root") as HTMLDivElement;
const root = createRoot(container);

import "@rainbow-me/rainbowkit/styles.css";
import { darkTheme, getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { polygon } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();
const config = getDefaultConfig({
  appName: "Vanity Market",
  projectId: "3ceb790c9f98b79ce035389f303abd69",
  chains: [
    {
      blockTime: 2000,
      id: parseInt(import.meta.env.VITE_GOLEM_DB_CHAIN_ID),
      name: "Golem DB",
      nativeCurrency: {
        name: "Golem",
        decimals: 18,
        symbol: "GLM",
      },
      rpcUrls: {
        default: {
          http: [import.meta.env.VITE_GOLEM_DB_RPC],
          webSocket: undefined,
        },
      },
    },
  ],
  ssr: false,
});

root.render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider defaultTheme="system" storageKey="ui-theme">
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider theme={darkTheme()}>
              <Dashboard />
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
