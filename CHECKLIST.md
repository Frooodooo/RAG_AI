# RAG Demo — Build Checklist
> Sprint: Feb 18–24 | ~22h total
> Last updated: Feb 19 2026 — reflects actual codebase state after audit

**Priority:** 🔴 blocks everything | 🟡 needed for demo | 🟢 nice to have

---

## Phase 0 — Local Setup (~2.5h)

- [x] 🔴 Install Ollama: https://ollama.ai (one .exe) `30m`
- [x] 🔴 `ollama pull alibayram/erurollm-9b-instruct` (5.6GB) `15m`
- [x] 🔴 `ollama pull nomic-embed-text-v2-moe` (1.9GB — v1 is English-only, v2 required for Latvian) `10m`
- [x] 🔴 Test: `curl http://localhost:11434/api/tags` `5m`
- [x] 🔴 `docker run -p 6333:6333 qdrant/qdrant` `10m`
- [x] 🔴 Import all 6 workflows into n8n via `node import-workflows.js` `20m`
  > _(health, documents, chat, upload, doc-search, doc-delete — see n8n-workflows/)_
- [x] 🔴 Install Node 18+, verify `node -v` `5m`
- [x] 🔴 Build & start doc-server: `docker build -t rag-doc-server ./doc-server && docker run -d --name rag-doc-server -p 3001:3001 -v rag_doc_data:/app/data --add-host=host.docker.internal:host-gateway rag-doc-server` `15m`
- [x] 🔴 Set up Cloudflare Quick Tunnel — installed cloudflared, tunnel runs via `start.ps1` `20m`
- [ ] 🔴 End-to-end test: upload 1 PDF via UI → ask question → verify sources appear `30m`
- [ ] 🔴 Pre-index 3–5 Riga-relevant PDFs before the meeting `20m`

---

## Phase 1 — n8n Workflows (~2.5h)

- [x] 🔴 Add Docker env vars: `N8N_PAYLOAD_SIZE_MAX=32mb`, `EXECUTIONS_TIMEOUT=-1` → restart n8n container `10m`
- [x] 🔴 **Activate all workflows** — production URL `/webhook/` only works when activated. Use `node reactivate-workflows.js` if they drop. `10m`
- [x] 🔴 All 6 workflows created and managed via code (`setup-n8n.js` / `import-workflows.js`): `30m`
  - `health.json` — GET `/webhook/health` → `{qdrant, ollama, n8n}`
  - `documents.json` — GET `/webhook/documents` → array from doc-server
  - `chat.json` — POST `/webhook/chat` → Ollama EuroLLM-9B → `{answer, sources[]}`
  - `upload.json` — POST `/webhook/upload` → doc-server register → Qdrant embed via nomic-embed-text-v2-moe
  - `doc-search.json` — POST `/webhook/doc-search` → SQLite FTS5 search via doc-server
  - `doc-delete.json` — POST `/webhook/doc-delete` → remove from doc-server + Qdrant collection
- [x] 🔴 Embedding model: `nomic-embed-text-v2-moe` (NOT v1 — English only) `15m`
- [x] 🔴 Upload workflow: accepts `{filename, fileBase64, mimeType}` JSON (NOT multipart — n8n bug #14876) `20m`
- [x] 🟡 Chat workflow: reads `sessionId` from request body `20m`
- [x] 🔴 Test all endpoints with curl before touching frontend `20m`
- [x] 🔴 N8N_API_KEY moved to `.env` (was hardcoded — security fix) — copy `.env.example` → `.env` and set key `10m`

---

## Phase 2 — React Setup (~1h)

- [x] 🔴 `pnpm create vite@latest rag-demo -- --template react-ts` `5m`
- [x] 🔴 `pnpm install tailwindcss @tailwindcss/vite reactflow @tanstack/react-query axios react-dropzone` `10m`
- [x] 🔴 `vite.config.ts`: proxy `/webhook → http://localhost:5678` + `/n8n-api → http://localhost:5678/api/v1` `10m`
  > `host: true` and `allowedHosts: true` **must both be present** for Cloudflare Quick Tunnel to work
- [x] 🔴 `src/api.ts`: axios instance with `timeout: 120_000`, functions `sendChat()`, `uploadFileAPI()`, `getDocs()`, `getHealth()`, `searchInDocs()`, `deleteDoc()` `30m`
- [x] 🔴 `App.tsx`: 3-tab layout (Chat | Workflow | Documents) + LV/EN switcher + health pips in nav rail `20m`

---

## Phase 3 — Chat UI (~3.5h)

- [x] 🔴 `ChatMessage.tsx`: user bubble right/blue, AI bubble left/white+border, markdown rendering, copy button `40m`
- [x] 🔴 `ChatInput.tsx`: textarea + send button + Ctrl+Enter `20m`
- [x] 🔴 `ChatPage.tsx`: messages[], loading, sessionId (UUID on mount) `20m`
- [x] 🔴 Wire send → POST `/webhook/chat`, append AI reply `25m`
- [x] 🟡 `ThinkingIndicator.tsx`: 3 pulsing dots + elapsed time counter ("Thinking... 14s") `25m`
- [x] 🟡 `SourcesPanel.tsx`: collapsible under each AI message, shows file + excerpt `40m`
- [x] 🟡 `SessionSidebar.tsx`: persistent chat sessions stored in localStorage via `chatSessionStore.ts` `40m`
- [x] 🟢 Starter question chips (click to fill input) `25m`
- [x] 🟢 LV/EN language switcher (`i18n.tsx`) with Latvian and English UI strings `20m`
- [ ] 🔴 Test: ask 3 real questions using Riga docs, verify sources appear `25m`

---

## Phase 4 — Workflow Visualizer (~5h)

- [x] 🔴 `WorkflowVisualizer.tsx`: ReactFlow instance, nodes + edges, loads from bundled `src/assets/chat-workflow.json` (no network fetch) `30m`
- [x] 🔴 Custom node components with colour coding `50m`
- [x] 🔴 Map chat workflow nodes → ReactFlow nodes with positions + edges `50m`
- [x] 🟡 Node click → right drawer with plain-English description `40m`
- [x] 🟢 Pulsing animation on edges when chat is processing `50m`

---

## Phase 5 — Documents (~2h)

- [x] 🟡 `UploadZone.tsx`: react-dropzone, accept PDF/DOCX/XLSX `35m`
- [x] 🟡 On drop → read file as base64 → POST `/webhook/upload` → show spinner `30m`
- [x] 🟡 `DocumentList.tsx`: table with filename, type badge, date, chunks, status — memoized rows + CSS hover `35m`
- [x] 🟡 `DocSearchPanel.tsx`: full-text search across indexed docs via `/webhook/doc-search` `30m`
- [x] 🟡 Delete document → POST `/webhook/doc-delete` → removes from doc-server + Qdrant `20m`
- [x] 🟡 `doc-server` (Express + SQLite + FTS5): registers docs, tracks status, serves keyword search `60m`
- [ ] 🔴 Pre-index 3–5 Riga-relevant docs before the meeting `20m`

---

## Phase 6 — Final Prep (~2h)

- [ ] 🔴 Full end-to-end test: upload → ask → sources → workflow diagram `45m`
- [ ] 🔴 Font sizes readable at projector distance (min 14px) `15m`
- [ ] 🟡 Screen record full demo as video backup on USB `25m`
- [ ] 🔴 Prepare 5 demo questions for Riga-specific docs `15m`
- [ ] 🔴 Start Ollama + warm up model 1h before meeting (first response slow) `5m`
- [ ] 🟡 Verify Cloudflare tunnel URL works from a different device before the meeting `10m`

---

## Security Fixes Applied (Feb 19 2026)

- [x] Hardcoded n8n JWT API key removed from all scripts — use `N8N_API_KEY` env var
- [x] `.env` excluded from git, `.env.example` provided
- [x] Response bodies not logged in maintenance scripts (prevent secret leakage)
- [x] HTTPS enforced in `setup-n8n.js` for non-localhost n8n connections
- [x] **Regression fix:** `allowedHosts: true` + `host: true` restored in `vite.config.ts` — removing these broke the Cloudflare tunnel (PR #30 regression)
- [x] **Regression fix:** API key validation regex updated to accept JWT-format keys (`.` separator, up to 512 chars) — old regex rejected valid n8n API keys

---

## Time Summary

| Phase | Est |
|-------|-----|
| 0 — Local Setup | 2.5h |
| 1 — n8n Workflows | 2.5h |
| 2 — React Setup | 1h |
| 3 — Chat UI | 3.5h |
| 4 — Workflow Visualizer | 5h |
| 5 — Documents | 2h |
| 6 — Final Prep | 2h |
| **Total** | **~18-20h** |

**Critical path:** Phase 0 → 1 → 3. Working chat demo is enough if time runs out.

**Start services:** `.\start.ps1` — starts Qdrant, n8n, doc-server, Vite dev server, Cloudflare tunnel in one go.
