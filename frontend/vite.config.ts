import dotenv from "dotenv";
dotenv.config();

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import compression from "vite-plugin-compression2";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "path";

// https://vitejs.dev/config https://vitest.dev/config
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    compression(),
/*    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),*/
  ],
  base: process.env.VITE_BASE || "/",
  define: {
    // Provide a minimal `process` object so code like process.env.NODE_ENV works
    process: null,
  },
  /*
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return id.toString().split("node_modules/")[1].split("/")[0].toString();
          }
        },
      },
    },
  },*/
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
