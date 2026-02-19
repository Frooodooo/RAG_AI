'use strict';

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// ─── Lazy-load heavy parsers to avoid startup errors if packages missing ───
let pdfParse, mammoth, XLSX;
try { pdfParse = require('pdf-parse'); } catch (_) { }
try { mammoth = require('mammoth'); } catch (_) { }
try { XLSX = require('xlsx'); } catch (_) { }

// ─── Setup ────────────────────────────────────────────────────────────────────
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'docs.db');
const PORT = process.env.PORT || 3001;

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);

// WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// ─── Schema ───────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id             TEXT PRIMARY KEY,
    filename       TEXT NOT NULL,
    file_hash      TEXT UNIQUE NOT NULL,
    mime_type      TEXT NOT NULL,
    file_size      INTEGER DEFAULT 0,
    status         TEXT DEFAULT 'processing',
    chunks         INTEGER DEFAULT 0,
    collection     TEXT,
    uploaded_at    TEXT NOT NULL,
    indexed_at     TEXT,
    error_message  TEXT
  );

  CREATE VIRTUAL TABLE IF NOT EXISTS doc_fts
    USING fts5(doc_id UNINDEXED, text, tokenize='unicode61');
`);

// ─── Text extraction ──────────────────────────────────────────────────────────
async function extractText(buffer, mimeType) {
  try {
    if ((mimeType === 'application/pdf' || mimeType.includes('pdf')) && pdfParse) {
      const parsed = await pdfParse(buffer);
      return parsed.text || '';
    }

    if (mimeType.includes('wordprocessingml') && mammoth) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    }

    if ((mimeType.includes('spreadsheetml') || mimeType.includes('xlsx')) && XLSX) {
      const wb = XLSX.read(buffer, { type: 'buffer' });
      return wb.SheetNames.map(name => {
        const ws = wb.Sheets[name];
        return `=== Sheet: ${name} ===\n` + XLSX.utils.sheet_to_csv(ws);
      }).join('\n\n');
    }

    // Plain text / fallback
    if (mimeType.startsWith('text/')) {
      return buffer.toString('utf-8');
    }
  } catch (err) {
    console.error('[extract]', err.message);
  }
  return '';
}

// ─── Safe collection name ─────────────────────────────────────────────────────
function toCollectionName(filename) {
  return filename
    .toLowerCase()
    .replace(/\.[^.]+$/, '')   // strip extension
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 64) || 'doc';
}

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '64mb' }));

// GET /health
app.get('/health', (_req, res) => res.json({ ok: true, db: DB_PATH }));

// ─── POST /docs/register ──────────────────────────────────────────────────────
// Body: { filename, fileBase64, mimeType }
// Returns: { duplicate, id, hash, collection, textLength, extractedText, filename, status }
app.post('/docs/register', async (req, res) => {
  const { filename, fileBase64, mimeType } = req.body || {};
  if (!filename || !fileBase64) {
    return res.status(400).json({ error: 'filename and fileBase64 are required' });
  }

  let buffer;
  try {
    buffer = Buffer.from(fileBase64, 'base64');
  } catch {
    return res.status(400).json({ error: 'Invalid base64 data' });
  }

  const hash = crypto.createHash('sha256').update(buffer).digest('hex');

  // ── Duplicate check ──
  const existing = db
    .prepare('SELECT id, filename, status, chunks, collection FROM documents WHERE file_hash = ?')
    .get(hash);

  if (existing) {
    // FIX: Ensure file exists in uploads even if DB record exists
    const existingPath = path.join(DATA_DIR, 'uploads', existing.id);
    if (!fs.existsSync(existingPath)) {
      console.log(`[register] Backfilling missing file for existing doc ${existing.id}`);
      fs.mkdirSync(path.join(DATA_DIR, 'uploads'), { recursive: true });
      fs.writeFileSync(existingPath, buffer);
    }

    return res.json({
      duplicate: true,
      id: existing.id,
      filename: existing.filename,
      status: existing.status,
      chunks: existing.chunks,
      collection: existing.collection,
      message: 'Document already indexed',
    });
  }

  // ── Extract text ──
  const extractedText = await extractText(buffer, mimeType || '');

  // ── Register ──
  const id = crypto.randomUUID();
  const collection = toCollectionName(filename);
  const uploadedAt = new Date().toISOString();

  // ── Save file to disk ──
  // Ensure we save the file so it can be downloaded later
  const savePath = path.join(DATA_DIR, 'uploads', id);
  fs.mkdirSync(path.join(DATA_DIR, 'uploads'), { recursive: true });
  fs.writeFileSync(savePath, buffer);

  db.prepare(`
    INSERT INTO documents (id, filename, file_hash, mime_type, file_size, status, collection, uploaded_at)
    VALUES (?, ?, ?, ?, ?, 'processing', ?, ?)
  `).run(id, filename, hash, mimeType || '', buffer.length, collection, uploadedAt);

  // ── Populate FTS with extracted text ──
  if (extractedText.trim().length > 0) {
    db.prepare('INSERT INTO doc_fts (doc_id, text) VALUES (?, ?)').run(id, extractedText);
  }

  return res.json({
    duplicate: false,
    id,
    hash,
    collection,
    filename,
    fileSize: buffer.length,
    textLength: extractedText.length,
    extractedText: extractedText.slice(0, 500_000), // cap at 500k chars sent to n8n
    status: 'processing',
  });
});

// ─── GET /docs/:id/download ───────────────────────────────────────────────────
app.get('/docs/:id/download', (req, res) => {
  const doc = db.prepare('SELECT filename, id FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });

  // 1. Try to find in uploads/ (User uploaded)
  let filePath = path.join(DATA_DIR, 'uploads', doc.id);

  // 2. If not found, check if it exists in a scraped-docs folder (Manual ingestion)
  // This is a bit hacky because doc-server doesn't track absolute path of ingested files
  // But we can check if a file with same NAME exists in known locations?
  // Or check if we have a 'path' column? (We don't).

  if (!fs.existsSync(filePath)) {
    // Fallback: check ../scraped-docs/filename
    // Valid only if running locally or if mounted volume matches
    const scrapedPath = path.resolve(__dirname, '..', 'scraped-docs', doc.filename);
    if (fs.existsSync(scrapedPath)) {
      filePath = scrapedPath;
    } else {
      // Fallback 2: maybe in current dir?
      if (fs.existsSync(doc.filename)) filePath = doc.filename;
    }
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File content not found on server disk' });
  }

  res.download(filePath, doc.filename);
});

// ─── GET /docs ────────────────────────────────────────────────────────────────
app.get('/docs', (_req, res) => {
  const docs = db.prepare(`
    SELECT id, filename, mime_type, file_size, status, chunks, collection,
           uploaded_at, indexed_at, error_message
    FROM documents
    ORDER BY uploaded_at DESC
  `).all();
  res.json(docs);
});

// ─── GET /docs/hash/:hash ─────────────────────────────────────────────────────
app.get('/docs/hash/:hash', (req, res) => {
  const doc = db
    .prepare('SELECT id, filename, status, chunks, collection FROM documents WHERE file_hash = ?')
    .get(req.params.hash);
  res.json(doc || null);
});

// ─── GET /docs/:id ────────────────────────────────────────────────────────────
app.get('/docs/:id', (req, res) => {
  const doc = db
    .prepare('SELECT * FROM documents WHERE id = ?')
    .get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
});

// ─── PATCH /docs/:id/status ───────────────────────────────────────────────────
// Body: { status, chunks?, error_message? }
app.patch('/docs/:id/status', (req, res) => {
  const { status, chunks, error_message } = req.body || {};
  const indexedAt = status === 'ready' ? new Date().toISOString() : null;

  db.prepare(`
    UPDATE documents
    SET status        = COALESCE(?, status),
        chunks        = COALESCE(?, chunks),
        error_message = COALESCE(?, error_message),
        indexed_at    = COALESCE(?, indexed_at)
    WHERE id = ?
  `).run(status, chunks ?? null, error_message ?? null, indexedAt, req.params.id);

  res.json({ ok: true });
});

// ─── DELETE /docs/:id ─────────────────────────────────────────────────────────
app.delete('/docs/:id', async (req, res) => {
  const docId = req.params.id;
  const doc = db.prepare('SELECT collection FROM documents WHERE id = ?').get(docId);
  if (!doc) return res.status(404).json({ error: 'Not found' });

  try {
    const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
    const collectionName = 'rag_docs';

    console.log(`[delete] Removing vectors for doc ${docId} from Qdrant...`);
    // Use fetch to call Qdrant API
    const qResp = await fetch(`${qdrantUrl}/collections/${collectionName}/points/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filter: {
          must: [
            { key: "doc_id", match: { value: docId } }
          ]
        }
      })
    });

    if (!qResp.ok) {
      console.error(`[delete] Qdrant error: ${qResp.status} ${await qResp.text()}`);
    } else {
      console.log(`[delete] Vectors removed.`);
    }

    // 2. Delete file from disk (uploads/docId)
    const uploadPath = path.join(DATA_DIR, 'uploads', docId);
    if (fs.existsSync(uploadPath)) {
      fs.unlinkSync(uploadPath);
      console.log(`[delete] File deleted from ${uploadPath}`);
    }

  } catch (err) {
    console.error(`[delete] Cleanup error:`, err);
  }

  db.prepare('DELETE FROM doc_fts WHERE doc_id = ?').run(docId);
  db.prepare('DELETE FROM documents WHERE id = ?').run(docId);

  res.json({ ok: true, collection: doc.collection });
});

// ─── POST /docs/search ────────────────────────────────────────────────────────
// Body: { query, docId? (optional filter), limit? }
// Uses SQLite FTS5 for fast full-text search with ranked snippets
app.post('/docs/search', (req, res) => {
  const { query, docId, limit = 10 } = req.body || {};
  if (!query || query.trim().length === 0) {
    return res.status(400).json({ error: 'query is required' });
  }

  // Escape FTS5 query to avoid syntax errors on special chars
  const safeQuery = query.replace(/['"*^()]/g, ' ').trim();
  if (!safeQuery) return res.json([]);

  try {
    let rows;
    if (docId) {
      rows = db.prepare(`
        SELECT d.id, d.filename, d.status, d.chunks,
               snippet(doc_fts, 1, '[', ']', '…', 24) AS excerpt,
               rank AS score
        FROM doc_fts
        JOIN documents d ON d.id = doc_fts.doc_id
        WHERE doc_fts MATCH ? AND doc_fts.doc_id = ?
        ORDER BY rank
        LIMIT ?
      `).all(safeQuery, docId, limit);
    } else {
      rows = db.prepare(`
        SELECT d.id, d.filename, d.status, d.chunks,
               snippet(doc_fts, 1, '[', ']', '…', 24) AS excerpt,
               rank AS score
        FROM doc_fts
        JOIN documents d ON d.id = doc_fts.doc_id
        WHERE doc_fts MATCH ?
        ORDER BY rank
        LIMIT ?
      `).all(safeQuery, limit);
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[doc-server] Running on port ${PORT}`);
  console.log(`[doc-server] Database: ${DB_PATH}`);
  console.log(`[doc-server] PDF parser: ${pdfParse ? 'ok' : 'MISSING (npm install pdf-parse)'}`);
  console.log(`[doc-server] DOCX parser: ${mammoth ? 'ok' : 'MISSING (npm install mammoth)'}`);
  console.log(`[doc-server] XLSX parser: ${XLSX ? 'ok' : 'MISSING (npm install xlsx)'}`);
});
