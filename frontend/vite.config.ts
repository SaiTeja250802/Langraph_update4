import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/app/",
  resolve: {
    alias: {
      "@": path.resolve(new URL(".", import.meta.url).pathname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:2024",
        changeOrigin: true,
        rewrite: (path) => path, // Keep /api prefix
      },
    },
    allowedHosts: [".replit.dev"],
  },
});
