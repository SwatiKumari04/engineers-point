import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, Vite proxies /api to the backend so the client can use relative
// paths and no server URL is hardcoded anywhere.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});
