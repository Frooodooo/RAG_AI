---
description: RAG n8n
---

0. REQUIRED DOCUMENTS (MANDATORY BEFORE DOING ANY WORK)
Before doing ANYTHING, the following two documents MUST be read in full:

1) DESIGN.md
The complete architectural and technical specification.
Defines:

Hardware constraints (e.g., RTX 4070 Ti 12GB VRAM limits).

Local model selections (e.g., EuroLLM-9B, nomic-embed-text-v2-moe) and Latvian language support nuances.

Stack routing (Ollama, Qdrant, n8n, Vite dev server) and remote access via Tailscale.

n8n webhook rules (activated production URLs vs. test URLs) and Docker environment variables.

Frontend architecture (React + Vite + ReactFlow 4-tab layout) and API handling.

2) CHECKLIST.md
The implementation progress tracker and sprint plan (Feb 18–24).
Defines:

Task priorities (🔴 blocking, 🟡 needed, 🟢 nice to have).

7 strictly ordered phases (Phase 0 to Phase 7) with time estimates.

What is completed, in progress, or pending.

⚠️ These two documents override ALL other information. If code and docs disagree, the docs are correct.

1. CONTEXT GATHERING (MUST BE DONE BEFORE EVERY TASK)
1.1 Load DESIGN.md
You must understand:

The exact port mappings (:11434 for Ollama, :6333 for Qdrant, :5678 for n8n, :3000 for Vite).

The mandatory Vite proxy configuration (/webhook -> http://localhost:5678) to prevent CORS issues.

The required n8n payload structure (base64 JSON for files, never multipart).

1.2 Load CHECKLIST.md
You must check:

Which phase (0 through 7) is currently active.

What priority level the next task holds (🔴, 🟡, 🟢).

Dependencies between phases (e.g., n8n curl tests must pass before touching React setup).

⚠️ Skipping checklist loading is not allowed.

1.3 Load the CURRENT CODE
Review:

n8n workflow JSON files (MainAgent.json, Metadata.json, health.json, documents.json).

vite.config.ts and src/api.ts.

src/components/* (Chat, WorkflowViz, Documents, CopilotComparison).

1.4 Determine CURRENT POSITION IN THE ROADMAP
The checklist defines a strict 22-hour critical path. Before starting work, determine if prerequisites in the current or previous Phase are completed.

2. WORK PLANNING (STRICT STRUCTURE)
2.1 Extract EXACT requirements from the spec
Implement only what is explicitly written in the phase definitions (e.g., specific Shadcn components, specific ReactFlow node colors).

2.2 Break the task into required pipeline stages:
Every feature ALWAYS includes relevant elements from this stack:

Infrastructure: Docker/Ollama model pulls and container checks.

n8n Workflows: Node configurations, JSON webhook inputs/outputs, AI/DB node connections.

API Layer: api.ts Axios definitions with 120_000 timeout.

Frontend UI: React components, Tailwind styling, ReactFlow mappings.

Testing: Curl commands or UI end-to-end tests.

3. IMPLEMENTATION
3.1 Backend & n8n Rules (Strict)

Webhooks: Workflows MUST be Activated. Only use /webhook/ endpoints, never /webhook-test/.

File Uploads: Always use JSON {filename, fileBase64, mimeType}. Do not use multipart/form-data due to n8n bug #14876.

Ollama Connections: Base URLs must point to http://host.docker.internal:11434/v1 with the key ollama.

Embeddings: Strictly use nomic-embed-text-v2-moe. Version 1 is English-only and will break Latvian semantic search.

3.2 Frontend Rules (Strict)

Proxy: No CORS headers in n8n. Rely entirely on the Vite proxy (/webhook -> localhost:5678).

State & UI: Use TailwindCSS, React Query, and shadcn/ui.

UX Blockers: Always include elapsed time counters ("Thinking... 14s") and typing indicators for AI responses.

Network: vite.config.ts must have host: true to ensure LAN access for Tailscale.

4. TESTING (MANDATORY VERIFICATION)
4.1 Execution

Phase-gate Testing: Test all n8n endpoints via curl BEFORE touching frontend code.

End-to-End Demo Check: Upload a document via the UI, ask a question, verify sources appear, and check the workflow diagram.

Remote Verification: Test the app from the work PC browser via Tailscale to verify Vite host: true is functioning.

4.2 Coverage Requirements
Testing must physically verify:

Latvian language queries return accurate chunk summaries.

The WorkflowVisualizer correctly maps MainAgent nodes and animates edges.

The UI font sizes are strictly readable at projector distance (min 14px).

5. DOCUMENTATION (MANDATORY BEFORE CHECKLIST UPDATE)
Update:

DESIGN.md (only if hardware, models, or n8n routing decisions change).

Inline code comments in React (especially around the Vite proxy or base64 file readers).

6. CHECKLIST UPDATE (MANDATORY FINAL STEP)
After finishing ANY subtask, update CHECKLIST.md.
Change the pending checkbox -[ ] to completed -[x].

Example structure format to maintain:

Markdown
## Phase 3 — Chat UI (~3.5h)

- [x] 🔴 `ChatMessage.tsx`: user bubble right/blue, AI bubble left/white+border `40m`
- [x] 🔴 `ChatInput.tsx`: textarea + send button + Ctrl+Enter `20m`
- [ ] 🔴 Chat state: `messages[]`, `loading`, `sessionId` (UUID on mount) `20m`
Rules:

NEVER leave ambiguous status.

ALWAYS update immediately after completing a step.

Do not delete the time estimates (20m, 35m) when checking off tasks.

7. ITERATION LOOP
This is the non-negotiable workflow cycle:

Load DESIGN.md →

Load CHECKLIST.md →

Load Code (n8n JSON + React) →

Plan →

Implement →

Test (curl & UI) →

Document →

Update CHECKLIST.md →

Proceed to Next Task