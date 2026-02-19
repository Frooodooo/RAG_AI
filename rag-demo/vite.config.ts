import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,         // listen on 0.0.0.0 — required for LAN access
    allowedHosts: true, // allow Cloudflare tunnel hostnames (*.trycloudflare.com)
    port: 3000,
    proxy: {
      '/webhook': {
        target: 'http://localhost:5678',
        changeOrigin: true,
      },
      '/n8n-api': {
        target: 'http://localhost:5678/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/n8n-api/, ''),
      }
    }
  }
})
// restart 2
