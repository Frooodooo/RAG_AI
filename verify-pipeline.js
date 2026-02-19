#!/usr/bin/env node
'use strict';

/**
 * verify-pipeline.js — Verify that documents are correctly stored in SQLite and Qdrant.
 *
 * Checks:
 *  1. SQLite doc-server: list all documents, check statuses
 *  2. Qdrant: collection info + point count
 *  3. Cross-check: each "ready" doc should have vectors in Qdrant
 *  4. Search test: run a sample FTS query
 */

const http = require('http');

const DOC_SERVER = 'http://localhost:3001';
const QDRANT = 'http://localhost:6333';

// ── Helpers ──────────────────────────────────────────────────────────────────────

function httpGet(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, data, raw: true }); }
            });
        }).on('error', reject);
    });
}

function httpPost(url, body) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const bodyStr = JSON.stringify(body);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) },
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, data, raw: true }); }
            });
        });
        req.on('error', reject);
        req.write(bodyStr);
        req.end();
    });
}

// ── Main ────────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n══════════════════════════════════════════════════════════');
    console.log('  RAG PIPELINE VERIFICATION');
    console.log('══════════════════════════════════════════════════════════\n');

    // ── 1. Check SQLite (doc-server) ──────────────────────────────────────────
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│  1. SQLite Document Server (port 3001)                  │');
    console.log('└─────────────────────────────────────────────────────────┘\n');

    let docs = [];
    try {
        const resp = await httpGet(`${DOC_SERVER}/docs`);
        docs = resp.data;

        if (!Array.isArray(docs)) {
            console.log('  ⚠ Unexpected response from /docs:', resp.data);
            docs = [];
        }

        const ready = docs.filter((d) => d.status === 'ready');
        const processing = docs.filter((d) => d.status === 'processing');
        const errored = docs.filter((d) => d.status === 'error');

        console.log(`  Total documents: ${docs.length}`);
        console.log(`    ✓ Ready:      ${ready.length}`);
        console.log(`    ⏳ Processing: ${processing.length}`);
        console.log(`    ✗ Error:      ${errored.length}`);
        console.log();

        // Print table
        console.log('  ┌──────────────────────────────────────────┬──────────┬────────┬──────────┐');
        console.log('  │ Filename                                 │ Status   │ Chunks │ Size     │');
        console.log('  ├──────────────────────────────────────────┼──────────┼────────┼──────────┤');

        for (const doc of docs) {
            const name = (doc.filename || 'unknown').slice(0, 40).padEnd(40);
            const status = (doc.status || '?').padEnd(8);
            const chunks = String(doc.chunks || 0).padStart(4).padEnd(6);
            const size = doc.file_size
                ? doc.file_size > 1024 * 1024
                    ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB`
                    : `${Math.round(doc.file_size / 1024)} KB`
                : 'n/a';
            console.log(`  │ ${name} │ ${status} │ ${chunks} │ ${size.padEnd(8)} │`);
        }
        console.log('  └──────────────────────────────────────────┴──────────┴────────┴──────────┘\n');

        if (errored.length > 0) {
            console.log('  Errored documents:');
            for (const doc of errored) {
                console.log(`    - ${doc.filename}: ${doc.error_message || 'no error message'}`);
            }
            console.log();
        }
    } catch (err) {
        console.log(`  ✗ Cannot reach doc-server at ${DOC_SERVER}: ${err.message}`);
        console.log('    Is docker running? Is doc-server up?\n');
    }

    // ── 2. Check Qdrant ──────────────────────────────────────────────────────
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│  2. Qdrant Vector Database (port 6333)                  │');
    console.log('└─────────────────────────────────────────────────────────┘\n');

    let qdrantPoints = 0;
    try {
        const resp = await httpGet(`${QDRANT}/collections/rag_docs`);
        const info = resp.data?.result;

        if (info) {
            qdrantPoints = info.points_count || 0;
            console.log(`  Collection: rag_docs`);
            console.log(`  Status:     ${info.status}`);
            console.log(`  Points:     ${qdrantPoints}`);
            console.log(`  Vectors:    ${info.config?.params?.vectors?.size || 'unknown'}-dimensional`);
            console.log(`  Distance:   ${info.config?.params?.vectors?.distance || 'unknown'}`);
        } else {
            console.log('  ⚠ Collection rag_docs not found or empty response');
        }
    } catch (err) {
        console.log(`  ✗ Cannot reach Qdrant at ${QDRANT}: ${err.message}`);
    }
    console.log();

    // ── 3. Cross-check ────────────────────────────────────────────────────────
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│  3. Cross-Check: SQLite docs vs Qdrant vectors          │');
    console.log('└─────────────────────────────────────────────────────────┘\n');

    const readyDocs = docs.filter((d) => d.status === 'ready');
    const totalSqliteChunks = readyDocs.reduce((sum, d) => sum + (d.chunks || 0), 0);

    console.log(`  Ready docs in SQLite:  ${readyDocs.length}`);
    console.log(`  Total chunks (SQLite): ${totalSqliteChunks}`);
    console.log(`  Total points (Qdrant): ${qdrantPoints}`);

    if (totalSqliteChunks > 0 && qdrantPoints > 0) {
        const ratio = (qdrantPoints / totalSqliteChunks * 100).toFixed(0);
        console.log(`  Match ratio:           ${ratio}%`);
        if (Math.abs(qdrantPoints - totalSqliteChunks) <= 5) {
            console.log(`  ✓ Counts match (within tolerance)`);
        } else if (qdrantPoints > totalSqliteChunks) {
            console.log(`  ⚠ Qdrant has more points than SQLite chunks (possible leftover data)`);
        } else {
            console.log(`  ⚠ Some chunks might be missing from Qdrant`);
        }
    } else if (readyDocs.length > 0 && qdrantPoints === 0) {
        console.log(`  ⚠ Docs are "ready" but Qdrant has no points — embedding may have failed`);
    }
    console.log();

    // ── 4. Search Test ────────────────────────────────────────────────────────
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│  4. Search Test (SQLite FTS5)                           │');
    console.log('└─────────────────────────────────────────────────────────┘\n');

    const testQueries = ['Rīga budžets', 'attīstība stratēģija', 'izglītība'];

    for (const query of testQueries) {
        try {
            const resp = await httpPost(`${DOC_SERVER}/docs/search`, { query, limit: 3 });
            const results = Array.isArray(resp.data) ? resp.data : [];

            if (results.length > 0) {
                console.log(`  ✓ Query "${query}" → ${results.length} results`);
                for (const r of results.slice(0, 2)) {
                    const excerpt = (r.excerpt || r.text || '').slice(0, 80).replace(/\n/g, ' ');
                    console.log(`    • ${r.filename || 'unknown'}: "${excerpt}…"`);
                }
            } else {
                console.log(`  ○ Query "${query}" → no results`);
            }
        } catch (err) {
            console.log(`  ✗ Search error for "${query}": ${err.message}`);
        }
    }

    console.log('\n══════════════════════════════════════════════════════════');
    console.log('  VERIFICATION COMPLETE');
    console.log('══════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
