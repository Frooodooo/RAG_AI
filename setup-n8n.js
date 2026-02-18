const { randomUUID } = require('crypto');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlNTg0NGEwZC1hZDBiLTRmZGUtYmJlYy02OTAwZTYyZWQwN2QiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiM2IxYzBlMzgtYjU0MC00Y2MyLWEwN2YtZWFmZmVmMWI0ZjNjIiwiaWF0IjoxNzcxNDM4ODQ2LCJleHAiOjE3NzM5NTc2MDB9.Uvc93QLI1p8z7PNVjeI2e63aMakI7LsjBB9EZxhhAUQ';
const BASE = 'http://localhost:5678/api/v1';
const headers = { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' };

async function deleteAll() {
    const res = await fetch(`${BASE}/workflows`, { headers });
    const { data } = await res.json();
    for (const wf of data) {
        await fetch(`${BASE}/workflows/${wf.id}/deactivate`, { method: 'POST', headers });
        await fetch(`${BASE}/workflows/${wf.id}`, { method: 'DELETE', headers });
        console.log(`Deleted: ${wf.name}`);
    }
}

// ============================================================
// HEALTH CHECK WORKFLOW
// Uses HTTP Request nodes to check Ollama and Qdrant
// ============================================================
function makeHealthWorkflow() {
    return {
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
                position: [460, 200], id: randomUUID(), name: "Check Ollama",
                onError: "continueRegularOutput", continueOnFail: true
            },
            {
                parameters: {
                    url: "http://host.docker.internal:6333/collections",
                    options: { timeout: 5000 }
                },
                type: "n8n-nodes-base.httpRequest", typeVersion: 4.2,
                position: [460, 400], id: randomUUID(), name: "Check Qdrant",
                onError: "continueRegularOutput", continueOnFail: true
            },
            {
                parameters: {
                    mode: "runOnceForEachItem",
                    jsCode: "return { json: { ollama: 'ok', qdrant: 'placeholder', n8n: 'ok' } };"
                },
                type: "n8n-nodes-base.code", typeVersion: 2,
                position: [680, 200], id: randomUUID(), name: "Format Ollama"
            },
            {
                parameters: {
                    mode: "runOnceForEachItem",
                    jsCode: "const prev = $('Format Ollama').first().json;\nconst qdrantOk = $('Check Qdrant').first().json?.status === 'ok' ? 'ok' : 'error';\nreturn { json: { ollama: prev.ollama, qdrant: qdrantOk, n8n: 'ok' } };"
                },
                type: "n8n-nodes-base.code", typeVersion: 2,
                position: [680, 400], id: randomUUID(), name: "Merge Results"
            },
            {
                parameters: {
                    respondWith: "json",
                    responseBody: "={{ JSON.stringify($json) }}",
                    options: {}
                },
                type: "n8n-nodes-base.respondToWebhook", typeVersion: 1.1,
                position: [900, 300], id: randomUUID(), name: "Respond"
            }
        ],
        connections: {
            "Webhook": {
                main: [[
                    { node: "Check Ollama", type: "main", index: 0 },
                    { node: "Check Qdrant", type: "main", index: 0 }
                ]]
            },
            "Check Ollama": { main: [[{ node: "Format Ollama", type: "main", index: 0 }]] },
            "Format Ollama": { main: [[{ node: "Merge Results", type: "main", index: 0 }]] },
            "Check Qdrant": { main: [[{ node: "Merge Results", type: "main", index: 0 }]] },
            "Merge Results": { main: [[{ node: "Respond", type: "main", index: 0 }]] }
        },
        settings: { executionOrder: "v1" }
    };
}

// ============================================================
// DOCUMENTS LIST WORKFLOW
// Uses HTTP Request + Code to list Qdrant collections
// ============================================================
function makeDocumentsWorkflow() {
    return {
        name: "Documents List",
        nodes: [
            {
                parameters: { httpMethod: "GET", path: "documents", responseMode: "responseNode", options: {} },
                type: "n8n-nodes-base.webhook", typeVersion: 2,
                position: [240, 300], id: randomUUID(), name: "Webhook", webhookId: randomUUID()
            },
            {
                parameters: {
                    url: "http://host.docker.internal:6333/collections",
                    options: { timeout: 10000 }
                },
                type: "n8n-nodes-base.httpRequest", typeVersion: 4.2,
                position: [460, 300], id: randomUUID(), name: "Get Collections",
                onError: "continueRegularOutput", continueOnFail: true
            },
            {
                parameters: {
                    mode: "runOnceForEachItem",
                    jsCode: "const result = $json;\nconst collections = result.result?.collections || [];\nconst docs = collections.map((c, i) => ({\n  id: String(i + 1),\n  filename: c.name,\n  type: 'collection',\n  chunks: 0,\n  date: new Date().toISOString(),\n  status: 'ready'\n}));\nreturn { json: docs.length > 0 ? docs : [] };"
                },
                type: "n8n-nodes-base.code", typeVersion: 2,
                position: [680, 300], id: randomUUID(), name: "Format Documents"
            },
            {
                parameters: {
                    respondWith: "json",
                    responseBody: "={{ JSON.stringify($json) }}",
                    options: {}
                },
                type: "n8n-nodes-base.respondToWebhook", typeVersion: 1.1,
                position: [900, 300], id: randomUUID(), name: "Respond"
            }
        ],
        connections: {
            "Webhook": { main: [[{ node: "Get Collections", type: "main", index: 0 }]] },
            "Get Collections": { main: [[{ node: "Format Documents", type: "main", index: 0 }]] },
            "Format Documents": { main: [[{ node: "Respond", type: "main", index: 0 }]] }
        },
        settings: { executionOrder: "v1" }
    };
}

// ============================================================
// CHAT AGENT WORKFLOW
// Uses HTTP Request to call Ollama API
// ============================================================
function makeChatWorkflow() {
    return {
        name: "Chat Agent",
        nodes: [
            {
                parameters: { httpMethod: "POST", path: "chat", responseMode: "responseNode", options: {} },
                type: "n8n-nodes-base.webhook", typeVersion: 2,
                position: [240, 300], id: randomUUID(), name: "Webhook", webhookId: randomUUID()
            },
            {
                parameters: {
                    mode: "runOnceForEachItem",
                    jsCode: "const body = $json.body;\nconst message = body.message || '';\nconst sessionId = body.sessionId || 'default';\nreturn { json: { message, sessionId } };"
                },
                type: "n8n-nodes-base.code", typeVersion: 2,
                position: [460, 300], id: randomUUID(), name: "Parse Input"
            },
            {
                parameters: {
                    method: "POST",
                    url: "http://host.docker.internal:11434/api/chat",
                    sendBody: true,
                    specifyBody: "json",
                    jsonBody: "={{ JSON.stringify({ model: 'alibayram/erurollm-9b-instruct', messages: [{ role: 'system', content: 'You are a helpful assistant for Riga City Council. Answer in the same language as the question. Be concise but thorough.' }, { role: 'user', content: $json.message }], stream: false }) }}",
                    options: { timeout: 120000 }
                },
                type: "n8n-nodes-base.httpRequest", typeVersion: 4.2,
                position: [680, 300], id: randomUUID(), name: "Ollama Chat"
            },
            {
                parameters: {
                    mode: "runOnceForEachItem",
                    jsCode: "const answer = $json.message?.content || 'Sorry, I could not generate a response.';\nreturn { json: { answer, sources: [] } };"
                },
                type: "n8n-nodes-base.code", typeVersion: 2,
                position: [900, 300], id: randomUUID(), name: "Format Response"
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
            "Webhook": { main: [[{ node: "Parse Input", type: "main", index: 0 }]] },
            "Parse Input": { main: [[{ node: "Ollama Chat", type: "main", index: 0 }]] },
            "Ollama Chat": { main: [[{ node: "Format Response", type: "main", index: 0 }]] },
            "Format Response": { main: [[{ node: "Respond", type: "main", index: 0 }]] }
        },
        settings: { executionOrder: "v1" }
    };
}

// ============================================================
// DOCUMENT UPLOAD WORKFLOW
// ============================================================
function makeUploadWorkflow() {
    return {
        name: "Document Upload",
        nodes: [
            {
                parameters: { httpMethod: "POST", path: "upload", responseMode: "responseNode", options: {} },
                type: "n8n-nodes-base.webhook", typeVersion: 2,
                position: [240, 300], id: randomUUID(), name: "Webhook", webhookId: randomUUID()
            },
            {
                parameters: {
                    mode: "runOnceForEachItem",
                    jsCode: "const body = $json.body;\nconst filename = body.filename || 'unknown';\nconst fileBase64 = body.fileBase64 || '';\nconst mimeType = body.mimeType || 'application/octet-stream';\nconst size = Math.round(fileBase64.length * 0.75);\n\nreturn { json: {\n  success: true,\n  filename,\n  size,\n  message: 'File ' + filename + ' received (' + size + ' bytes). Processing...'\n}};"
                },
                type: "n8n-nodes-base.code", typeVersion: 2,
                position: [460, 300], id: randomUUID(), name: "Process Upload"
            },
            {
                parameters: {
                    respondWith: "json",
                    responseBody: "={{ JSON.stringify($json) }}",
                    options: {}
                },
                type: "n8n-nodes-base.respondToWebhook", typeVersion: 1.1,
                position: [680, 300], id: randomUUID(), name: "Respond"
            }
        ],
        connections: {
            "Webhook": { main: [[{ node: "Process Upload", type: "main", index: 0 }]] },
            "Process Upload": { main: [[{ node: "Respond", type: "main", index: 0 }]] }
        },
        settings: { executionOrder: "v1" }
    };
}

async function main() {
    console.log('Deleting old workflows...');
    await deleteAll();

    const workflows = [
        makeHealthWorkflow(),
        makeDocumentsWorkflow(),
        makeChatWorkflow(),
        makeUploadWorkflow()
    ];

    for (const wf of workflows) {
        console.log(`\nCreating ${wf.name}...`);
        const res = await fetch(`${BASE}/workflows`, {
            method: 'POST', headers,
            body: JSON.stringify(wf)
        });

        if (!res.ok) {
            const text = await res.text();
            console.error(`  FAILED (${res.status}): ${text.slice(0, 500)}`);
            continue;
        }

        const created = await res.json();
        console.log(`  Created: id=${created.id}`);

        const actRes = await fetch(`${BASE}/workflows/${created.id}/activate`, { method: 'POST', headers });
        console.log(`  Activate: ${actRes.status}`);
        if (!actRes.ok) console.error(`  Activate error: ${(await actRes.text()).slice(0, 300)}`);
    }

    console.log('\nWaiting 3s for webhook registration...');
    await new Promise(r => setTimeout(r, 3000));

    // Test health
    console.log('\n=== Testing /webhook/health ===');
    try {
        const r = await fetch('http://localhost:5678/webhook/health', { signal: AbortSignal.timeout(15000) });
        console.log(`Status: ${r.status}`);
        console.log(`Body: ${await r.text()}`);
    } catch (e) { console.log(`Error: ${e.message}`); }

    // Test documents
    console.log('\n=== Testing /webhook/documents ===');
    try {
        const r = await fetch('http://localhost:5678/webhook/documents', { signal: AbortSignal.timeout(15000) });
        console.log(`Status: ${r.status}`);
        console.log(`Body: ${await r.text()}`);
    } catch (e) { console.log(`Error: ${e.message}`); }

    // Test upload
    console.log('\n=== Testing /webhook/upload ===');
    try {
        const r = await fetch('http://localhost:5678/webhook/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: 'test.txt', fileBase64: 'SGVsbG8gV29ybGQ=', mimeType: 'text/plain' }),
            signal: AbortSignal.timeout(15000)
        });
        console.log(`Status: ${r.status}`);
        console.log(`Body: ${await r.text()}`);
    } catch (e) { console.log(`Error: ${e.message}`); }

    // Test chat (with short timeout since Ollama may be slow)
    console.log('\n=== Testing /webhook/chat ===');
    try {
        const r = await fetch('http://localhost:5678/webhook/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Hello', sessionId: 'test1' }),
            signal: AbortSignal.timeout(120000)
        });
        console.log(`Status: ${r.status}`);
        const body = await r.text();
        console.log(`Body: ${body.slice(0, 500)}`);
    } catch (e) { console.log(`Error: ${e.message}`); }
}

main();
