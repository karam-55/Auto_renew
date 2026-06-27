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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split screens into chunks by module area
          if (id.includes('node_modules')) {
            if (id.includes('chart.js')) return 'charts'
            if (id.includes('qrcode')) return 'qrcode'
            return 'vendor'
          }
          if (id.includes('/screens/')) {
            if (id.includes('/accounting')) return 'accounting'
            if (id.includes('/reports')) return 'reports'
            if (id.includes('/inventory')) return 'inventory'
            if (id.includes('/booking')) return 'bookings'
            if (id.includes('/invoice')) return 'invoices'
            if (id.includes('/customer')) return 'customers'
            return 'screens'
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));
