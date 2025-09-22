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

const queryClient = new QueryClient();

const router = createBrowserRouter([
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
]);

root.render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
