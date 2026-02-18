# RAG Demo — Build Checklist
> Sprint: Feb 18–24 | ~22h total

**Priority:** 🔴 blocks everything | 🟡 needed for demo | 🟢 nice to have

---

## Phase 0 — Local Setup (~2.5h)

- [x] 🔴 Install Ollama: https://ollama.ai (one .exe) `30m`
- [x] 🔴 `ollama pull alibayram/erurollm-9b-instruct` (5.6GB) `15m`
- [x] 🔴 `ollama pull nomic-embed-text-v2-moe` (1.9GB — v1 is English-only, v2 required for Latvian) `10m`
- [x] 🔴 Test: `curl http://localhost:11434/api/tags` `5m`
- [x] 🔴 `docker run -p 6333:6333 qdrant/qdrant` `10m`
- [x] 🔴 Import all 4 workflows into n8n `20m`
- [x] 🔴 Fix MCP webhook IDs in MainAgent.json (point to your FunctionServer webhook ID) `15m`
- [ ] 🔴 End-to-end test: ingest 1 PDF via Metadata → chat in n8n built-in UI `30m`
- [x] 🔴 Install Node 18+, verify `node -v && npm -v` `5m`
- [ ] 🔴 Install Tailscale on home PC + work PC → confirm work PC browser opens `http://[ts-ip]:3000` `20m`

---

## Phase 1 — n8n Changes (~2.5h)

- [x] 🔴 Add Docker env vars: `N8N_PAYLOAD_SIZE_MAX=32mb`, `EXECUTIONS_TIMEOUT=-1` → restart n8n container `10m`
- [x] 🔴 **Activate all workflows** (toggle top-right in editor) — production URL `/webhook/` only works when activated. `/webhook-test/` is useless from frontend. `10m`
- [x] 🔴 MainAgent response body: change to `{answer: "...", sources: [{file, excerpt, score}]}` `30m`
- [x] 🟡 MainAgent: read `sessionId` from request body, use as memory buffer key `20m`
- [x] 🔴 Swap OpenAI Chat node → Ollama: base URL `http://host.docker.internal:11434/v1`, key `ollama`, model `eurollm-9b` `20m`
- [ ] 🔴 Swap OpenAI Embeddings node → Ollama: model `nomic-embed-text-v2-moe` (NOT v1 — English only) `15m`
- [x] 🟡 Create `health.json`: GET `/webhook/health` → `{qdrant, ollama, n8n}` `25m`
- [x] 🟡 Create `documents.json`: GET `/webhook/documents` → array from Qdrant collection info `30m`
- [x] 🟡 Metadata.json: add Webhook trigger accepting JSON `{filename, fileBase64, mimeType}` — **NOT multipart** (n8n bug #14876: binary property missing from multipart webhook output) `40m`
- [x] 🟡 Metadata.json: add Code node `Buffer.from($json.fileBase64, 'base64')` before Extract from File node `20m`
- [x] 🔴 Test all endpoints with curl before touching frontend `20m`

---

## Phase 2 — React Setup (~1h)

- [x] 🔴 `npm create vite@latest rag-demo -- --template react-ts` `5m`
- [x] 🔴 `npm install tailwindcss @tailwindcss/vite reactflow @tanstack/react-query axios uuid react-dropzone` `10m`
- [ ] 🟡 `npx shadcn@latest init` `10m`
- [x] 🔴 `vite.config.ts`: add proxy `'/webhook' → http://localhost:5678` + `host: true` (LAN access for Tailscale) `10m`
- [x] 🔴 `src/api.ts`: axios instance with `timeout: 120_000`, functions `sendChat()`, `uploadDoc()`, `getDocs()`, `getHealth()` `30m`
- [x] 🔴 `App.tsx`: 4-tab layout (Chat | How It Works | Documents | Why Not Copilot) `20m`

---

## Phase 3 — Chat UI (~3.5h)

- [x] 🔴 `ChatMessage.tsx`: user bubble right/blue, AI bubble left/white+border `40m`
- [x] 🔴 `ChatInput.tsx`: textarea + send button + Ctrl+Enter `20m`
- [x] 🔴 Chat state: `messages[]`, `loading`, `sessionId` (UUID on mount) `20m`
- [x] 🔴 Wire send → POST `/webhook/chat`, append AI reply `25m`
- [x] 🟡 Typing indicator: 3 pulsing dots + elapsed time counter ("Thinking... 14s") while awaiting response `25m`
- [x] 🟡 `SourcesPanel.tsx`: collapsible under each AI message, shows file + excerpt `40m`
- [x] 🟢 Starter question chips (3–4, click to fill input) `25m`
- [ ] 🔴 Test: ask 3 real questions, verify sources appear `25m`

---

## Phase 4 — Workflow Visualizer (~5h)

- [x] 🔴 `WorkflowVisualizer.tsx`: 4 sub-tabs, one ReactFlow instance per workflow `30m`
- [x] 🔴 Custom node components: `TriggerNode` (green), `AINode` (purple), `DBNode` (blue), `CodeNode` (orange) `50m`
- [x] 🔴 Map MainAgent nodes → ReactFlow nodes with positions + edges `50m`
- [x] 🟡 Map FunctionServer nodes `25m`
- [x] 🟡 Map Vectordatabase nodes `35m`
- [x] 🟡 Map Metadata nodes (simplify 35 → ~12 key nodes) `45m`
- [x] 🟡 Node click → right drawer with plain-English description `40m`
- [x] 🟢 "Animate Flow" button → pulsing dot along edges `50m`

---

## Phase 5 — Documents (~2h)

- [x] 🟡 `UploadZone.tsx`: react-dropzone, accept PDF/DOCX/XLSX `35m`
- [x] 🟡 On drop → read file as base64 (`FileReader.readAsDataURL`) → POST `/webhook/upload` with `{filename, fileBase64, mimeType}` → show spinner `30m`
- [x] 🟡 `DocumentList.tsx`: table with filename, type badge, date, chunks, status `35m`
- [ ] 🟢 Poll `/webhook/status/:jobId` every 2s → progress bar `30m`
- [ ] 🔴 Pre-index 3–5 Riga-relevant docs before the meeting `20m`

---

## Phase 6 — Copilot Comparison (~1h)

- [x] 🟡 Cost table: open stack vs Copilot Studio (8 rows) `30m`
- [x] 🟡 EU AI Act compliance checklist: ✅ vs ❌ per requirement `20m`
- [x] 🟢 Add TildeOpen mention: "Latvian company Tilde built a 30B model for Latvian, EC-funded. Instruct version coming — we swap it in when ready." `10m`

---

## Phase 7 — Final Prep (~2h)

- [ ] 🔴 Full end-to-end test: upload → ask → sources → workflow diagram `45m`
- [ ] 🔴 Test from work PC browser via Tailscale — verify no errors (Vite `host: true` enables LAN access) `20m`
- [ ] 🔴 Font sizes readable at projector distance (min 14px) `15m`
- [ ] 🟡 Screen record full demo as video backup on USB `25m`
- [ ] 🔴 Prepare 5 demo questions for Riga-specific docs `15m`
- [ ] 🔴 Start Ollama + warm up model 1h before meeting (first response is slow) `5m`

---

## Time Summary

| Phase | Est |
|-------|-----|
| 0 — Local Setup | 2.5h |
| 1 — n8n Changes | 2.5h |
| 2 — React Setup | 1h |
| 3 — Chat UI | 3.5h |
| 4 — Workflow Visualizer | 5h |
| 5 — Documents | 2h |
| 6 — Copilot Comparison | 1h |
| 7 — Final Prep | 2h |
| **Total** | **~20-22h** |

7 evenings × 3h = 21h ✅

**Critical path:** Phase 0 → 1 → 3. Working chat demo is enough if time runs out.
