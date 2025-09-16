import { createRoot } from "react-dom/client";
import "./index.css";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import { ThemeProvider } from "./components/theme-provider";
const container = document.getElementById("root") as HTMLDivElement;
const root = createRoot(container);
//vite env

root.render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider defaultTheme="system" storageKey="ui-theme">
        <Dashboard />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
