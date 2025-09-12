import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import compression from "vite-plugin-compression2";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import dotenv from "dotenv";
dotenv.config();

// https://vitejs.dev/config https://vitest.dev/config
export default defineConfig({
  plugins: [react(), compression()],
  base: process.env.VITE_BASE || "/",
  define: {
    // Provide a minimal `process` object so code like process.env.NODE_ENV works
    process: null,
  },
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
  },
});
