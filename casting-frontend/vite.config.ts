import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/castings": "http://localhost:8080",
      "/residents": "http://localhost:8080",
      "/cleaning-duties": "http://localhost:8080",
      "/rooms": "http://localhost:8080",
      "/auth": "http://localhost:8080",
      "/magic-link": "http://localhost:8080",
      "/calendar-entries": "http://localhost:8080",
      "/aemtli": "http://localhost:8080",
    },
  },
});
