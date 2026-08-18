import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

const projectRoot = process.cwd();

export default defineConfig({
  root: path.resolve(projectRoot, "client"),
  plugins: [react(), tailwindcss(), vitePluginManusRuntime()],
  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "client/src"),
      "@shared": path.resolve(projectRoot, "shared"),
    },
  },
  base: process.env.VITE_BASE_PATH || "/",
  build: {
    outDir: path.resolve(projectRoot, "dist/public"),
    emptyOutDir: true,
  },
});
