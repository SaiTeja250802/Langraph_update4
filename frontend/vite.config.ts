import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/app/", // ✅ Matches the LangGraph backend base URL
  resolve: {
    alias: {
      "@": path.resolve(new URL(".", import.meta.url).pathname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    proxy: {
      "/app": {
        target: "http://localhost:2024", // 👈 local backend port during dev
        changeOrigin: true,
        rewrite: (path) => path, // ✅ Keep /app prefix, do not strip
      },
    },
    allowedHosts: [".replit.dev"],
  },
});



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
//         target: "https://8a819468-1cda-4cbb-a603-88b6cc03248d-00-36dwqs0lajeza.picard.replit.dev",
//         changeOrigin: true,
//         rewrite: (path) => path.replace(/^\/api/, ""),
//       },
//     },
//     allowedHosts: [".replit.dev"],
//   },
// });
