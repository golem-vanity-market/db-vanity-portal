import { createRoot } from "react-dom/client";
import "tailwindcss/tailwind.css";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
const container = document.getElementById("root") as HTMLDivElement;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter basename={"dashboard"}>
      <Dashboard />
    </BrowserRouter>
  </React.StrictMode>,
);
