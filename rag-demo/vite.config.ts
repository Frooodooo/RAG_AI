import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Read N8N_API_KEY from rag-demo/.env first, then fall back to parent RAG_AI/.env
  // The key is injected server-side into proxy headers — never exposed to the browser
  const localEnv = loadEnv(mode, process.cwd(), '')
  const parentEnv = loadEnv(mode, path.resolve(process.cwd(), '..'), '')
  const n8nApiKey =
    localEnv.N8N_API_KEY ||
    parentEnv.N8N_API_KEY ||
    process.env.N8N_API_KEY ||
    ''

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,          // listen on 0.0.0.0 — required for LAN access
      allowedHosts: true,  // allow Cloudflare tunnel hostnames (*.trycloudflare.com)
      port: 3000,
      proxy: {
        // ── Specific webhook overrides (must come before the generic /webhook rule) ──
        // Route upload + health directly to doc-server, bypassing n8n's
        // Docker-networking issues (host.docker.internal not always resolvable).
        '/webhook/upload': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (_p) => '/upload',
        },
        '/webhook/health': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (_p) => '/health',
        },
        // ── Generic n8n webhook proxy (chat, etc.) ──
        '/webhook': {
          target: 'http://localhost:5678',
          changeOrigin: true,
        },
        '/doc-api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/doc-api/, ''),
        },
        // n8n REST API — API key injected by proxy, never sent to browser
        '/n8n-api': {
          target: 'http://localhost:5678/api/v1',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/n8n-api/, ''),
          headers: n8nApiKey ? { 'X-N8N-API-KEY': n8nApiKey } : {},
        },
      },
    },
  }
})
// restart 3
