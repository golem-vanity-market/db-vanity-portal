import { createRoot } from "react-dom/client";
import "./index.css";
import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Dashboard from "./Dashboard";
import { ThemeProvider } from "./components/theme-provider";
const container = document.getElementById("root") as HTMLDivElement;
const root = createRoot(container);

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import Welcome from "./Welcome";
import ProvidersPage from "./providers/ProvidersPage";
import { AccountPage } from "./Account";
import DetailsPage from "./provider/DetailsPage";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit/react";
import { defineChain } from "@reown/appkit/networks";
import { WagmiProvider } from "wagmi";

const golemBaseNetwork = defineChain({
  id: Number(import.meta.env.VITE_GOLEM_DB_CHAIN_ID),
  caipNetworkId: `eip155:${import.meta.env.VITE_GOLEM_DB_CHAIN_ID}`,
  chainNamespace: "eip155",
  name: "Golem DB",
  nativeCurrency: {
    decimals: 18,
    name: "ETH",
    symbol: "ETH",
  },
  blockExplorers: {
    default: { name: "default_block_explorer", url: String(import.meta.env.VITE_GOLEM_DB_BLOCK_EXPLORER || "") },
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_GOLEM_DB_RPC || ""],
      webSocket: [import.meta.env.VITE_GOLEM_DB_RPC_WS || ""],
    },
  },
});

const queryClient = new QueryClient();

const router = createBrowserRouter(
  [
    {
      element: <Dashboard />,
      children: [
        {
          path: "/",
          index: true,
          element: <Welcome />,
        },
        {
          path: "/providers",
          element: <ProvidersPage />,
        },
        {
          path: "/provider",
          element: <DetailsPage />,
        },
        {
          path: "/account",
          element: <AccountPage />,
        },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
);

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "";

const wagmiAdapter = new WagmiAdapter({
  networks: [golemBaseNetwork],
  projectId,
  ssr: false,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [golemBaseNetwork],
  projectId,
  features: {
    analytics: false,
    socials: false,
    email: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "var(--color-primary)",
    "--w3m-font-family": "var(--font-heading)",
    "--w3m-border-radius-master": "2px",
  },
});

root.render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
