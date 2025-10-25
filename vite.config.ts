import { defineConfig, loadEnv } from "vite";
//@ts-expect-error missing types
import react from "@vitejs/plugin-react";
import compression from "vite-plugin-compression2";
//@ts-expect-error missing types
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
//@ts-expect-error somehow it works
import path from "path";

// https://vitejs.dev/config https://vitest.dev/config
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [
      react({
        babel: {
          plugins: ["babel-plugin-react-compiler"],
        },
      }),
      tailwindcss(),
      compression(),
      nodePolyfills({
        // Whether to polyfill `node:` protocol imports.
        include: ["buffer"],
      }),
    ],
    base: env.VITE_BASE || "/",
    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              return id
                .toString()
                .split("node_modules/")[1]
                .split("/")[0]
                .toString();
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
