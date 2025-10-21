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
import AnalyticsPage from "./providers/AnalyticsPage";
import { NewOrderPage } from "./order/NewOrderPage";
import { MyOrdersPage } from "./order/MyOrdersPage";
import DetailsPage from "./provider/DetailsPage";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit/react";
import { defineChain } from "@reown/appkit/networks";
import { WagmiProvider } from "wagmi";
import { assetsUrl } from "@/utils";
import { Toaster } from "@/components/ui/sonner";
import OrderResultsPage from "./order/OrderResults";

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
    default: {
      name: "default_block_explorer",
      url: String(import.meta.env.VITE_GOLEM_DB_BLOCK_EXPLORER || ""),
    },
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
          path: "/analytics",
          element: <AnalyticsPage />,
        },
        {
          path: "/provider",
          element: <DetailsPage />,
        },
        {
          path: "/order",
          element: <MyOrdersPage />,
        },
        {
          path: "/order/new",
          element: <NewOrderPage />,
        },
        {
          path: "/order/:orderId/results",
          element: <OrderResultsPage />,
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
  chainImages: {
    [golemBaseNetwork.id]: `${assetsUrl()}golem_db_logo.svg`,
  },
  themeVariables: {
    "--w3m-accent": "var(--color-primary)",
    "--w3m-font-family": "var(--font-heading)",
    "--w3m-border-radius-master": "2px",
  },
});

root.render(
  <React.StrictMode>
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="ui-theme">
          <RouterProvider router={router} />
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);
