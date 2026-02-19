const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const DOC_SERVER_URL = 'http://localhost:3001';
const OLLAMA_URL = 'http://localhost:11434/api/embeddings';
const QDRANT_URL = 'http://localhost:6333';
const EMBED_MODEL = 'nomic-embed-text-v2-moe';
const COLLECTION_NAME = 'rag_docs';
const CHUNK_SIZE = 500;
const OVERLAP = 50;

async function processFile(filePath) {
    const filename = path.basename(filePath);
    console.log(`Processing ${filename}...`);

    try {
        // 1. Read file and prepare payload
        const buffer = fs.readFileSync(filePath);
        const base64 = buffer.toString('base64');
        let mimeType = 'application/octet-stream';
        if (filename.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (filename.endsWith('.txt')) mimeType = 'text/plain';
        else if (filename.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        // 2. Register document with Doc-Server (extracts text)
        console.log('  Registering with Doc-Server...');
        const regRes = await axios.post(`${DOC_SERVER_URL}/docs/register`, {
            filename,
            fileBase64: base64,
            mimeType
        }, { maxBodyLength: Infinity, maxContentLength: Infinity });

        const { id, extractedText, duplicate } = regRes.data;

        if (duplicate) {
            console.log(`  Document already exists (ID: ${id}). Skipping embedding, but ensured it is uploaded.`);
            return;
        }

        if (!extractedText || extractedText.trim().length === 0) {
            console.log('  No text extracted. Marking as ready with 0 chunks.');
            await updateStatus(id, 0);
            return;
        }

        console.log(`  Text extracted (${extractedText.length} chars). Chunking...`);

        // 3. Chunk text
        const chunks = [];
        for (let pos = 0; pos < extractedText.length; pos += (CHUNK_SIZE - OVERLAP)) {
            const text = extractedText.slice(pos, pos + CHUNK_SIZE).trim();
            if (text.length >= 20) chunks.push(text);
        }
        // Cap at 200 chunks for safety/speed in demo
        const cappedChunks = chunks.slice(0, 200);
        console.log(`  Generated ${cappedChunks.length} chunks.`);

        // 4. Generate Embeddings (Ollama)
        console.log('  Generating embeddings...');
        const points = [];
        for (let i = 0; i < cappedChunks.length; i++) {
            try {
                const embRes = await axios.post(OLLAMA_URL, {
                    model: EMBED_MODEL,
                    prompt: cappedChunks[i]
                });

                if (embRes.data.embedding) {
                    points.push({
                        id: Date.now() + i, // Simple unique ID
                        vector: embRes.data.embedding,
                        payload: {
                            text: cappedChunks[i],
                            doc_id: id,
                            filename: filename,
                            chunk_index: i
                        }
                    });
                }
            } catch (err) {
                console.error(`  Error embedding chunk ${i}: ${err.message}`);
            }
            if (i % 10 === 0) process.stdout.write('.');
        }
        process.stdout.write('\n');

        // 5. Insert into Qdrant
        if (points.length > 0) {
            console.log(`  Inserting ${points.length} points into Qdrant...`);
            // Ensure collection exists (idempotent-ish check/create)
            // We'll just try to create just in case, ignore error
            try {
                await axios.put(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
                    vectors: { size: 768, distance: 'Cosine' }
                });
            } catch (e) { /* ignore if exists */ }

            await axios.put(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points`, {
                points: points
            });
        }

        // 6. Update Status
        console.log('  Updating status...');
        await updateStatus(id, cappedChunks.length);
        console.log('  Done!');

    } catch (err) {
        if (err.response) {
            console.error(`  Failed: HTTP ${err.response.status} - ${JSON.stringify(err.response.data)}`);
        } else {
            console.error(`  Failed: ${err.message}`);
        }
    }
}

async function updateStatus(docId, totalChunks) {
    await axios.patch(`${DOC_SERVER_URL}/docs/${docId}/status`, {
        status: 'ready',
        chunks: totalChunks
    });
}

function getAllFiles(dirPath, arrayOfFiles) {
    files = fs.readdirSync(dirPath)
    arrayOfFiles = arrayOfFiles || []

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file))
        }
    })

    return arrayOfFiles
}

// Check if running directly
if (require.main === module) {
    const targetDir = path.resolve(__dirname, 'scraped-docs');
    if (fs.existsSync(targetDir)) {
        console.log('Processing files in scraped-docs...');
        const allFiles = getAllFiles(targetDir);

        (async () => {
            for (const filePath of allFiles) {
                if (['.txt', '.pdf', '.docx'].includes(path.extname(filePath).toLowerCase())) {
                    await processFile(filePath);
                }
            }
        })();

    } else {
        console.log('No scraped-docs directory found.');
    }
}

module.exports = { processFile };
