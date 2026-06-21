import { defineConfig } from "vite";

export default defineConfig(async () => ({
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    proxy: {
      '/api': {
        // Use localhost for dev; update to production IP only for builds
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    },
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
