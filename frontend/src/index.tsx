import { createRoot } from "react-dom/client";
import "./index.css";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import { ThemeProvider } from "./components/theme-provider";
const container = document.getElementById("root") as HTMLDivElement;
const root = createRoot(container);

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();

root.render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider defaultTheme="system" storageKey="ui-theme">
        <QueryClientProvider client={queryClient}>
          <Dashboard />
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
