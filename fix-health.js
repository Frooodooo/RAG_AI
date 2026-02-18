const { randomUUID } = require('crypto');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlNTg0NGEwZC1hZDBiLTRmZGUtYmJlYy02OTAwZTYyZWQwN2QiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiM2IxYzBlMzgtYjU0MC00Y2MyLWEwN2YtZWFmZmVmMWI0ZjNjIiwiaWF0IjoxNzcxNDM4ODQ2LCJleHAiOjE3NzM5NTc2MDB9.Uvc93QLI1p8z7PNVjeI2e63aMakI7LsjBB9EZxhhAUQ';
const BASE = 'http://localhost:5678/api/v1';
const headers = { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' };

async function main() {
    // Delete old health workflow
    const listRes = await fetch(`${BASE}/workflows`, { headers });
    const { data } = await listRes.json();
    const health = data.find(w => w.name === 'Health Check');
    if (health) {
        await fetch(`${BASE}/workflows/${health.id}/deactivate`, { method: 'POST', headers });
        await fetch(`${BASE}/workflows/${health.id}`, { method: 'DELETE', headers });
        console.log('Deleted old Health Check');
    }

    // Create simplified health workflow - sequential with proper flow
    const wf = {
        name: "Health Check",
        nodes: [
            {
                parameters: { httpMethod: "GET", path: "health", responseMode: "responseNode", options: {} },
                type: "n8n-nodes-base.webhook", typeVersion: 2,
                position: [240, 300], id: randomUUID(), name: "Webhook", webhookId: randomUUID()
            },
            {
                parameters: {
                    url: "http://host.docker.internal:11434/api/tags",
                    options: { timeout: 5000 }
                },
                type: "n8n-nodes-base.httpRequest", typeVersion: 4.2,
                position: [460, 300], id: randomUUID(), name: "Check Ollama",
                onError: "continueRegularOutput", continueOnFail: true
            },
            {
                parameters: {
                    url: "http://host.docker.internal:6333/collections",
                    options: { timeout: 5000 }
                },
                type: "n8n-nodes-base.httpRequest", typeVersion: 4.2,
                position: [680, 300], id: randomUUID(), name: "Check Qdrant",
                onError: "continueRegularOutput", continueOnFail: true
            },
            {
                parameters: {
                    mode: "runOnceForEachItem",
                    jsCode: "const ollamaResult = $('Check Ollama').first().json;\nconst qdrantResult = $('Check Qdrant').first().json;\nconst ollama = ollamaResult && ollamaResult.models ? 'ok' : 'error';\nconst qdrant = qdrantResult && qdrantResult.status === 'ok' ? 'ok' : 'error';\nreturn { json: { ollama, qdrant, n8n: 'ok' } };"
                },
                type: "n8n-nodes-base.code", typeVersion: 2,
                position: [900, 300], id: randomUUID(), name: "Merge"
            },
            {
                parameters: {
                    respondWith: "json",
                    responseBody: "={{ JSON.stringify($json) }}",
                    options: {}
                },
                type: "n8n-nodes-base.respondToWebhook", typeVersion: 1.1,
                position: [1120, 300], id: randomUUID(), name: "Respond"
            }
        ],
        connections: {
            "Webhook": { main: [[{ node: "Check Ollama", type: "main", index: 0 }]] },
            "Check Ollama": { main: [[{ node: "Check Qdrant", type: "main", index: 0 }]] },
            "Check Qdrant": { main: [[{ node: "Merge", type: "main", index: 0 }]] },
            "Merge": { main: [[{ node: "Respond", type: "main", index: 0 }]] }
        },
        settings: { executionOrder: "v1" }
    };

    const createRes = await fetch(`${BASE}/workflows`, {
        method: 'POST', headers, body: JSON.stringify(wf)
    });
    const created = await createRes.json();
    console.log(`Created: ${created.id}`);

    const actRes = await fetch(`${BASE}/workflows/${created.id}/activate`, { method: 'POST', headers });
    console.log(`Activated: ${actRes.status}`);

    await new Promise(r => setTimeout(r, 2000));

    // Test
    console.log('\n--- Testing /webhook/health ---');
    const r = await fetch('http://localhost:5678/webhook/health', { signal: AbortSignal.timeout(15000) });
    console.log(`Status: ${r.status}`);
    console.log(`Body: ${await r.text()}`);
}

main();
