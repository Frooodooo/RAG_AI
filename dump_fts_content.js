const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'doc-server', 'data', 'docs.db');
const db = new Database(DB_PATH, { readonly: true });

const filename = 'RGKI_2022.xlsx';

console.log(`Looking for ${filename} in ${DB_PATH}...`);

const doc = db.prepare('SELECT id FROM documents WHERE filename = ?').get(filename);

if (!doc) {
    console.error('Document not found in registry.');
    process.exit(1);
}

console.log(`Found ID: ${doc.id}`);

const row = db.prepare('SELECT text FROM doc_fts WHERE doc_id = ?').get(doc.id);

if (!row || !row.text) {
    console.error('No text content found in doc_fts table!');
} else {
    console.log(`\n--- Extracted Text (${row.text.length} chars) ---`);
    console.log(row.text.slice(0, 1000)); // Print first 1000 chars
    console.log('\n... (truncated)');
}
