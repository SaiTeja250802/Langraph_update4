// import path from "node:path";
// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react-swc";
// import tailwindcss from "@tailwindcss/vite";

// export default defineConfig({
//   plugins: [react(), tailwindcss()],
//   base: "/app/",
//   resolve: {
//     alias: {
//       "@": path.resolve(new URL(".", import.meta.url).pathname, "./src"),
//     },
//   },
//   server: {
//     host: "0.0.0.0",
//     proxy: {
//       "/api": {
//         target: "http://localhost:2024",
//         changeOrigin: true,
//         rewrite: (path) => path, // Keep /api prefix
//       },
//     },
//     allowedHosts: [".replit.dev"],
//   },
// });
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
    allowedHosts: [
      ".replit.dev",
      "vscode-f6468197-53b3-48d5-9694-f1c7c42c22f2.preview.emergentagent.com", // added host
    ],
  },
});
