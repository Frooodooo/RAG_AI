# RAG Demo — Design Document
> Riga City Council Innovation Dept meeting | Feb 2026

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

### Embeddings — ⚠️ Critical Fix

| Model | Latvian | Size | Ollama |
|-------|---------|------|--------|
| `nomic-embed-text` (v1) | ❌ **English only** | ~300MB | `nomic-embed-text` |
| `nomic-embed-text-v2-moe` | ✅ ~100 languages incl. Latvian | ~1.9GB | `nomic-embed-text-v2-moe` |

**Use v2-moe.** v1 is English-only (trained on BooksCorpus + English Wikipedia only). Latvian text through v1 = meaningless vectors = broken semantic search.

> ⚠️ If you already have docs indexed with v1 embeddings, re-index everything after switching. Vectors are incompatible between versions.

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

## 3. Stack

```
Home PC:
  Ollama          :11434   ← LLM + embeddings
  Qdrant (Docker) :6333    ← vector DB (existing)
  n8n (Docker)    :5678    ← workflow engine (existing workflows)
  Vite dev server :3000    ← React frontend

Work PC:
  Browser only → http://[tailscale-ip]:3000
```

### Remote Access Options

| Tool | Setup | Cost |
|------|-------|------|
| **Tailscale** | Install on both PCs, get stable private IP | Free |
| **ngrok** | `npx ngrok http 3000` → instant HTTPS URL | Free tier |

---

## 4. n8n Changes

### Docker env vars (add to docker-compose before touching workflows)

```yaml
environment:
  - N8N_PAYLOAD_SIZE_MAX=32mb        # base64 JSON uploads need this (default 16mb)
  - EXECUTIONS_TIMEOUT=-1            # unlimited (default, but make explicit)
```

### ⚠️ Test URL vs Production URL — Critical

n8n has two webhook URLs per workflow:
- `/webhook-test/...` — only fires once while you're clicking "Listen" in the editor. **Useless from frontend.**
- `/webhook/...` — only active when workflow is **Activated** (toggle top-right of editor).

**Always Activate every workflow before testing from React.** Use `/webhook/` URLs only.

### Existing Workflows — Minimal Changes

| Workflow | Change |
|----------|--------|
| `MainAgent.json` | 1. Return `{answer, sources: [{file, excerpt, score}]}`<br>2. Swap OpenAI node → Ollama `http://host.docker.internal:11434/v1` |
| `Metadata.json` | 1. Add Webhook trigger accepting `{filename, fileBase64, mimeType}` (JSON, NOT multipart)<br>2. Code node: `Buffer.from($json.fileBase64, 'base64')` → pass to Extract from File<br>3. Swap embeddings → `nomic-embed-text-v2-moe` via Ollama |
| `FunctionServer.json` | No changes |
| `Vectordatabase.json` | No changes |

> ❌ **Do NOT use multipart/form-data for uploads.** n8n has a confirmed bug (GitHub #14876, Apr 2025) where `binary` property is missing from webhook output when using multipart. Use base64 JSON instead.

> ❌ **Do NOT add CORS headers in n8n.** Handled by Vite proxy (see Section 5). n8n CORS env vars have a regression in v1.103+ and are unreliable.

### New Workflows to Create

```
health.json     GET /webhook/health     → {qdrant: ok, ollama: ok, n8n: ok}
documents.json  GET /webhook/documents  → [{id, filename, type, chunks, date}]
```

---

## 5. Frontend — React + Vite

```
src/
  api.ts
  App.tsx                    ← 4-tab layout
  components/
    Chat/
      ChatMessage.tsx         ← user (right/blue) | AI (left/white)
      ChatInput.tsx           ← textarea + send + Ctrl+Enter
      SourcesPanel.tsx        ← collapsible, filename + excerpt + score
    WorkflowViz/
      WorkflowVisualizer.tsx  ← ReactFlow wrapper, 4 sub-tabs
      nodes/
        TriggerNode.tsx       ← green
        AINode.tsx            ← purple
        DBNode.tsx            ← blue
        CodeNode.tsx          ← orange
    Documents/
      UploadZone.tsx          ← react-dropzone, PDF/DOCX/XLSX
      DocumentList.tsx        ← table: name, type, date, chunks, status
    CopilotComparison/
      ComparisonTable.tsx     ← cost + compliance table
```

### Dependencies

```bash
npm create vite@latest rag-demo -- --template react-ts
npm install tailwindcss @tailwindcss/vite reactflow @tanstack/react-query axios uuid react-dropzone
npx shadcn@latest init
```

### `vite.config.ts` — Proxy (eliminates ALL CORS issues)

```ts
export default defineConfig({
  server: {
    host: true,          // expose to LAN (needed for Tailscale access from work PC)
    proxy: {
      '/webhook': {
        target: 'http://localhost:5678',
        changeOrigin: true,
      }
    }
  }
})
```

Frontend calls `/webhook/chat` → Vite forwards to `http://localhost:5678/webhook/chat`. Browser never sees a cross-origin request. No CORS config needed anywhere.

### `.env`

```
# No n8n URL needed — all calls go through Vite proxy as /webhook/...
```

### `api.ts` — Timeout

```ts
// EuroLLM-9B generates ~15-20 tok/s. 300 token response = ~20s. Set generous timeout.
const api = axios.create({ timeout: 120_000 })
```

Show elapsed time counter in UI while waiting ("Thinking... 14s") so the demo doesn't look frozen.

---

## 6. Frontend Pages

### Tab 1 — Chat
- Session UUID on mount, sent with every message
- POST `/webhook/chat` → `{message, sessionId}` → `{answer, sources[]}`
- Typing indicator (3 dots) + elapsed time counter ("Thinking... 14s") while loading
- SourcesPanel collapsible under each AI reply
- 3–4 starter question chips

### Tab 2 — How It Works (ReactFlow)
- 4 sub-tabs: Main Agent | Function Server | Vector Search | Ingestion
- Node types: Trigger (green), AI/LLM (purple), DB (blue), Code (orange)
- Click any node → right drawer with plain-English description
- "Animate Flow" button → dot travels edges

### Tab 3 — Documents
- Drag-drop → read file as base64 → POST `/webhook/upload` with `{filename, fileBase64, mimeType}`
- Poll `/webhook/status/:jobId` every 2s → progress bar
- Table: filename | type badge | date | chunk count | status

### Tab 4 — Why Not Copilot
- Cost table (open stack vs Copilot)
- EU AI Act checklist (✅ vs ❌)
- Mention TildeOpen + EuroLLM as EU sovereignty argument

---

## 7. n8n Node Config for Ollama

Chat model nodes:
```
Base URL:  http://host.docker.internal:11434/v1
API Key:   ollama
Model:     eurollm-9b
```

Embeddings nodes:
```
Base URL:  http://host.docker.internal:11434/v1
API Key:   ollama
Model:     nomic-embed-text-v2-moe
```

> Use `host.docker.internal` if n8n runs in Docker. Use `localhost` if n8n runs natively.

---

## 8. Demo Script (8 min)

1. Open site. "Runs on my home PC in Riga. No Microsoft servers."
2. How It Works tab → click nodes → "Every step visible, fully auditable."
3. Upload a Riga city PDF → show progress bar
4. Chat: ask question → show answer + expand Sources
5. "We know exactly which paragraph generated this. Copilot cannot do this."
6. Why Not Copilot tab → cost table
7. "Latvian company Tilde built a 30B model specifically for Latvian, EC-funded. When the instruct version ships, we swap it in. Our stack supports any model."
8. "RTX 4070 Ti class PC, 128GB RAM, ~€3-4k one-time. 3 months. I build this for Riga."
