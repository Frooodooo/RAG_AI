const axios = require('axios');

const OLLAMA_URL = 'http://localhost:11434/api/embeddings';
const QDRANT_URL = 'http://localhost:6333';
const EMBED_MODEL = 'nomic-embed-text-v2-moe';
const COLLECTION_NAME = 'rag_docs';

const QUERY = "What are the strategic goals for Riga in 2030?";

async function testRetrieval() {
    console.log(`Query: "${QUERY}"`);
    console.log('1. Generating embedding for query...');

    try {
        const embRes = await axios.post(OLLAMA_URL, {
            model: EMBED_MODEL,
            prompt: QUERY
        });
        const vector = embRes.data.embedding;
        console.log(`   Vector generated (length: ${vector.length})`);

        console.log('2. Searching Qdrant...');
        const searchRes = await axios.post(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points/search`, {
            vector: vector,
            limit: 3,
            with_payload: true
        });

        const results = searchRes.data.result;
        console.log(`   Found ${results.length} matches.\n`);

        results.forEach((match, i) => {
            console.log(`--- MATCH #${i + 1} (Score: ${match.score.toFixed(4)}) ---`);
            console.log(`Source: ${match.payload.filename}`);
            console.log(`Text Chunk:\n${match.payload.text}\n`);
        });

    } catch (err) {
        console.error('Error:', err.message);
        if (err.response) console.error(err.response.data);
    }
}

testRetrieval();
