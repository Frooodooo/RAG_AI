# RAG Demo — Design Document
> Riga City Council Innovation Dept meeting | Feb 2026
> Last updated: Feb 19 2026 — reflects actual built system

---

## 1. Hardware

| Component | Spec | Notes |
|-----------|------|-------|
| GPU | RTX 4070 Ti 12GB VRAM | Runs 7B Q8 or 14B Q4 |
| RAM | 32GB (Windows ~8GB used = ~22GB free) | Plenty for n8n + Qdrant + Vite |
| CPU | Ryzen 9 7900X | CPU offload if needed |

Work PC needs **only a browser**. Home PC runs everything.

---

## 2. Local Models — Latvian Support

### LLM Options

| Model | Latvian | VRAM | Ollama | Notes |
|-------|---------|------|--------|-------|
| **EuroLLM-9B** | ✅ Good | ~6GB | `alibayram/erurollm-9b-instruct` | EU-funded, all 24 EU languages, instruction-tuned, Apache 2.0. **Best practical choice for demo.** |
| **Qwen2.5 14B Q4** | ⚠️ Partial | ~9.5GB | `qwen2.5:14b` | Smarter model, mediocre Latvian generation. Fine for English docs + Latvian RAG. |
| **Qwen2.5 7B Q8** | ⚠️ Partial | ~8.5GB | `qwen2.5:7b` | Faster, similar Latvian limits. Fine for RAG. |
| **TildeOpen 30B** | ✅ Best Latvian | ❌ Too big | see below | **BASE MODEL ONLY** — no instruction following. Can't use for chat/RAG yet. |
| **OpenEuroLLM-Latvian** | ✅ Good | ~5GB | `jobautomation/OpenEuroLLM-Latvian` | Gemma3 fine-tuned for Latvian. Worth testing. |

### TildeOpen — Why Not Yet

- 30B parameter **base model** — no system prompt, no instruction following, no alignment
- Built by Latvian company Tilde, funded by European Commission, trained on LUMI supercomputer (768 AMD MI250X GPUs)
- Specifically designed for Nordic + Eastern European languages including Latvian, Latgalian, Estonian, Lithuanian
- GGUF available on HuggingFace: `hf.co/mradermacher/TildeOpen-30b-GGUF`
- **VRAM problem on your 12GB:**
  - Q4_K_M = 18.5GB → **doesn't fit**
  - Q2_K = 11.6GB → barely fits but severely degraded quality
  - IQ2_XXS (imatrix) = 8.5GB → fits but very low quality
- No instruct version yet — next release will be translation-focused fine-tune
- **Action:** Watch `TildeAI` on HuggingFace. When instruct version drops, it becomes the primary model.
- **For the meeting:** Mention it by name. "Latvian company Tilde built a 30B model for Latvian, EC-funded. We're watching it — when the instruction-tuned version ships, we swap it in." Strong talking point.

### Embeddings — ⚠️ Critical Fix (Applied)

| Model | Latvian | Size | Ollama |
|-------|---------|------|--------|
| `nomic-embed-text` (v1) | ❌ **English only** | ~300MB | `nomic-embed-text` |
| `nomic-embed-text-v2-moe` | ✅ ~100 languages incl. Latvian | ~1.9GB | `nomic-embed-text-v2-moe` |

**Use v2-moe.** v1 is English-only. Latvian text through v1 = meaningless vectors = broken semantic search.
The upload workflow (`n8n-workflows/upload.json`) is already configured to use `nomic-embed-text-v2-moe`.

> ⚠️ If you already have docs indexed with v1 embeddings, delete all documents and re-index. Vectors are incompatible between versions.

### Final Recommendation

```bash
# LLM
ollama pull alibayram/erurollm-9b-instruct    # ~5.6GB, instruct, Latvian ✅

# Embeddings
ollama pull nomic-embed-text-v2-moe           # ~1.9GB, multilingual ✅

# Fallback LLM (smarter, slower)
ollama pull qwen2.5:14b                       # ~9.5GB
```

> **RAG caveat:** For RAG, Latvian works better than pure chat — the model mostly summarizes retrieved chunks rather than generating Latvian from scratch. Even weaker models handle this acceptably.

---

## 3. Stack (Actual Built System)

```
Internet
    ↓ HTTPS
Cloudflare Quick Tunnel (*.trycloudflare.com)
    ↓ HTTP to localhost:3000
Vite Dev Server :3000    ← React + TypeScript frontend
    ↓ proxy /webhook/* and /n8n-api/*
n8n :5678 (Docker)       ← 6 workflow automations
    ↓ HTTP Request nodes
Ollama :11434            ← EuroLLM-9B (chat) + nomic-embed-text-v2-moe (embed)
Qdrant :6333 (Docker)    ← vector store
doc-server :3001 (Docker)← Express + SQLite + FTS5 (doc registry + keyword search)
```

### Remote Access — Cloudflare Quick Tunnel

The project uses **Cloudflare Quick Tunnel** (free, accountless, no install beyond cloudflared.exe):

```powershell
# Starts automatically inside start.ps1:
cloudflared.exe tunnel --url http://localhost:3000
```

- Generates a new random `https://*.trycloudflare.com` URL each run
- No uptime guarantee — for production use a named Cloudflare Tunnel
- **Vite requirement:** `vite.config.ts` must have `allowedHosts: true` or all tunnel requests are rejected by Vite's host-header security check

### Starting Everything

```powershell
.\start.ps1   # starts Qdrant, n8n, doc-server, Vite, tunnel in sequence
              # prints local URL + public tunnel URL when ready
```

---

## 4. n8n Workflows

### Docker env vars (required)

```yaml
environment:
  - N8N_PAYLOAD_SIZE_MAX=32mb        # base64 JSON uploads need this (default 16mb)
  - EXECUTIONS_TIMEOUT=-1            # unlimited
```

### ⚠️ Test URL vs Production URL — Critical

n8n has two webhook URLs per workflow:
- `/webhook-test/...` — only fires once while you're clicking "Listen" in the editor. **Useless from frontend.**
- `/webhook/...` — only active when workflow is **Activated** (toggle top-right of editor).

**Always Activate every workflow before testing from React.** Use `node reactivate-workflows.js` to bulk-reactivate after n8n restart.

### 6 Active Workflows

All workflows live as JSON in `n8n-workflows/` and are managed via script — do not edit manually in n8n UI or changes will be lost on next import.

| File | Endpoint | Method | Description |
|------|----------|--------|-------------|
| `health.json` | `/webhook/health` | GET | Checks Ollama + Qdrant, returns `{qdrant, ollama, n8n}` |
| `documents.json` | `/webhook/documents` | GET | Lists docs from doc-server → `ApiDocument[]` |
| `chat.json` | `/webhook/chat` | POST | EuroLLM-9B via Ollama → `{answer, sources[]}` |
| `upload.json` | `/webhook/upload` | POST | Registers in doc-server → embeds in Qdrant via nomic-v2 |
| `doc-search.json` | `/webhook/doc-search` | POST | FTS5 keyword search via doc-server |
| `doc-delete.json` | `/webhook/doc-delete` | POST | Removes from doc-server + Qdrant collection |

### Workflow Management Scripts

```bash
# First-time setup (deletes existing + recreates)
N8N_API_KEY=your_key node setup-n8n.js

# Import from n8n-workflows/ JSON files (safer, preserves manual edits)
N8N_API_KEY=your_key node import-workflows.js

# Reactivate all workflows after n8n restart
N8N_API_KEY=your_key node reactivate-workflows.js

# Recreate only the Health Check workflow
N8N_API_KEY=your_key node fix-health.js
```

> N8N_API_KEY supports both JWT format (older n8n) and `n8n_api_` format (n8n v1+). Copy `.env.example` → `.env` to set it persistently.

### Upload Flow Detail

```
POST /webhook/upload {filename, fileBase64, mimeType}
    → n8n: Extract Input (validate)
    → POST http://host.docker.internal:3001/docs/register
        ← returns {id, collection, extractedText, duplicate?}
    → [if not duplicate] embed extractedText via nomic-embed-text-v2-moe
    → upsert into Qdrant collection named after filename
    → PATCH http://host.docker.internal:3001/docs/{id}/status {status: 'ready', chunks}
    → respond {success, id, filename, processing}
```

> ❌ **Do NOT use multipart/form-data.** n8n confirmed bug #14876: `binary` property missing from webhook multipart output. Always send `{filename, fileBase64, mimeType}` JSON.

> ❌ **Do NOT add CORS headers in n8n.** Handled by Vite proxy. n8n CORS env vars have a regression in v1.103+ and are unreliable.

---

## 5. doc-server

A small Express + SQLite service running in Docker on port 3001. Provides:

- **Document registry** — SQLite table tracking id, filename, hash, status, chunks, indexed_at
- **Deduplication** — SHA-256 hash prevents re-indexing the same file
- **FTS5 keyword search** — fast full-text search over extracted document text (supplements semantic vector search)
- **Text extraction** — PDF (pdf-parse), DOCX (mammoth), XLSX (xlsx), plain text

```
doc-server/
  server.js       ← Express app, all endpoints
  package.json
  Dockerfile

Endpoints:
  GET  /health
  POST /docs/register   {filename, fileBase64, mimeType} → {id, collection, extractedText, ...}
  GET  /docs            → all documents
  GET  /docs/:id
  GET  /docs/hash/:hash → dedup check
  PATCH /docs/:id/status {status, chunks, error_message}
  DELETE /docs/:id
  POST /docs/search     {query, docId?, limit} → FTS5 results with snippets
```

Build and run:
```bash
docker build -t rag-doc-server ./doc-server
docker run -d --name rag-doc-server -p 3001:3001 \
  -v rag_doc_data:/app/data \
  --add-host=host.docker.internal:host-gateway \
  rag-doc-server
```

---

## 6. Frontend — React + Vite

### File Structure (Actual)

```
rag-demo/
  vite.config.ts          ← proxy + host/allowedHosts config
  src/
    api.ts                ← axios client: sendChat, uploadFileAPI, getDocs,
                             getHealth, searchInDocs, deleteDoc
    App.tsx               ← 3-tab nav rail (Chat | Workflow | Documents)
                             + LV/EN switcher + health pips
    i18n.tsx              ← translations (Latvian + English)
    components/
      Chat/
        ChatPage.tsx      ← session management, message list
        ChatMessage.tsx   ← user bubble (right) | AI bubble (left), markdown, copy
        ChatInput.tsx     ← textarea + send + Ctrl+Enter
        SourcesPanel.tsx  ← collapsible sources under AI messages
        SessionSidebar.tsx← session list with timestamps, rename, delete
        ThinkingIndicator.tsx ← pulsing dots + elapsed timer
      Documents/
        DocumentsPage.tsx ← main documents tab
        UploadZone.tsx    ← react-dropzone, PDF/DOCX/XLSX
        DocumentList.tsx  ← memoized rows, status badges, delete
        DocSearchPanel.tsx← FTS5 keyword search across indexed docs
      WorkflowViz/
        WorkflowVisualizer.tsx ← ReactFlow, loads chat-workflow.json at build time
      Icons.tsx           ← shared SVG icon components
      RigaLogo.tsx
    hooks/
      chatSessionStore.ts ← localStorage persistence (sessions, messages)
      useChatSessions.ts  ← React hook wrapping the store
    utils/
      date.ts             ← formatRelativeTime utility
    assets/
      chat-workflow.json  ← bundled workflow definition (no network fetch)
```

### Package Manager

Uses **pnpm** (not npm). Lock file: `rag-demo/pnpm-lock.yaml`.

```bash
cd rag-demo
pnpm install
pnpm dev        # starts Vite on :3000
```

### `vite.config.ts` — Critical Settings

```ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,          // listen on 0.0.0.0 — required for LAN access
    allowedHosts: true,  // REQUIRED: allows *.trycloudflare.com Host headers
    port: 3000,
    proxy: {
      '/webhook': {
        target: 'http://localhost:5678',   // → n8n webhooks
        changeOrigin: true,
      },
      '/n8n-api': {
        target: 'http://localhost:5678/api/v1',  // → n8n REST API
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/n8n-api/, ''),
      }
    }
  }
})
```

> ⚠️ **Both `host: true` and `allowedHosts: true` must stay.** Removing either breaks the Cloudflare tunnel. The proxy eliminates all CORS issues — the browser never sees a cross-origin request.

### `api.ts` — Timeout

```ts
// EuroLLM-9B generates ~15-20 tok/s. 300 token response = ~20s.
const api = axios.create({ timeout: 120_000 })
```

---

## 7. Frontend Pages

### Tab 1 — Chat

- Session UUID on mount, sent with every message
- POST `/webhook/chat` → `{message, sessionId}` → `{answer, sources[]}`
- Persistent sessions stored in localStorage — sidebar shows history with relative timestamps
- ThinkingIndicator (3 dots + elapsed time) while loading
- SourcesPanel collapsible under each AI reply
- Starter question chips
- LV/EN language toggle

### Tab 2 — How It Works (ReactFlow)

- ReactFlow instance loaded from bundled `src/assets/chat-workflow.json` (zero network requests at runtime)
- Node types colour-coded: Trigger (green), AI/LLM (purple), DB (blue), Code (orange)
- Pulsing edge animation when a chat request is in flight

### Tab 3 — Documents

- Drag-drop → read file as base64 → POST `/webhook/upload`
- Deduplication via SHA-256 (doc-server rejects re-uploads)
- DocumentList with status (processing → ready → error), chunk count, delete button
- DocSearchPanel: full-text keyword search (FTS5) across all indexed documents

---

## 8. n8n Node Config for Ollama

Chat model nodes:
```
Base URL:  http://host.docker.internal:11434/v1
API Key:   ollama
Model:     alibayram/erurollm-9b-instruct
```

Embeddings nodes:
```
Base URL:  http://host.docker.internal:11434/v1
API Key:   ollama
Model:     nomic-embed-text-v2-moe
```

> Use `host.docker.internal` if n8n runs in Docker (standard). Use `localhost` if n8n runs natively.

---

## 9. Security Notes

| Item | Status |
|------|--------|
| N8N_API_KEY in `.env` (not hardcoded) | ✅ Fixed Feb 19 |
| `.env` in `.gitignore` | ✅ |
| Response bodies not logged | ✅ Fixed Feb 19 |
| HTTPS enforced for remote n8n connections | ✅ |
| `allowedHosts: true` in vite.config.ts | ✅ Restored Feb 19 (regression fix) |
| doc-server CORS | Wide open (`cors()`) — intentional for local dev |
| doc-server auth | None — only accessible from n8n container via `host.docker.internal` |

---

## 10. Demo Script (8 min)

1. Open site (tunnel URL). "Runs on my home PC in Riga. No Microsoft servers."
2. **Workflow tab** → show the flow diagram. "Every step is visible, fully auditable."
3. **Documents tab** → upload a Riga city PDF → show it appear as 'ready'
4. **Chat tab** → ask question → show answer + expand Sources panel
5. "We know exactly which paragraph generated this. Copilot cannot show you this."
6. "Latvian company Tilde built a 30B model specifically for Latvian, EC-funded. When the instruct version ships, we swap it in. One config change."
7. "RTX 4070 Ti class PC — ~€3-4k one-time. No per-query cost. Your data never leaves the building."
