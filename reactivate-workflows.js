const API_KEY = process.env.N8N_API_KEY;
const BASE = process.env.N8N_BASE_URL || 'http://localhost:5678/api/v1';

if (!API_KEY) {
    console.error('Error: N8N_API_KEY environment variable is not set.');
    process.exit(1);
}

if (!/^[a-zA-Z0-9_-]{5,255}$/.test(API_KEY)) {
    console.error('Error: N8N_API_KEY must be a valid alphanumeric string (5-255 chars).');
    process.exit(1);
}

const headers = { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' };
const CONCURRENCY = 5;

async function processWorkflow(wf) {
    console.log(`\n${wf.name} (${wf.id}) - active: ${wf.active}`);

    // Deactivate
    const deact = await fetch(`${BASE}/workflows/${wf.id}/deactivate`, { method: 'POST', headers });
    console.log(`  Deactivate ${wf.id}: ${deact.status}`);

    // Wait a moment
    await new Promise(r => setTimeout(r, 500));

    // Reactivate
    const act = await fetch(`${BASE}/workflows/${wf.id}/activate`, { method: 'POST', headers });
    console.log(`  Activate ${wf.id}: ${act.status}`);

    if (!act.ok) {
        const text = await act.text();
        console.log(`  Error ${wf.id}: ${text.slice(0, 300)}`);
    }
}

async function main() {
    // List workflows
    const res = await fetch(`${BASE}/workflows`, { headers });
    const { data } = await res.json();

    console.log(`Processing ${data.length} workflows with concurrency ${CONCURRENCY}...`);

    const queue = [...data];
    const workers = Array(CONCURRENCY).fill(null).map(async () => {
        while (queue.length > 0) {
            const wf = queue.shift();
            if (wf) {
                await processWorkflow(wf);
            }
        }
    });

    await Promise.all(workers);

    // Wait and test health
    await new Promise(r => setTimeout(r, 2000));
    console.log('\n--- Testing /webhook/health ---');
    try {
        const h = await fetch('http://localhost:5678/webhook/health');
        console.log(`  Status: ${h.status}`);
        const body = await h.text();
        console.log(`  Body: ${body.slice(0, 500)}`);
    } catch (e) {
        console.log(`  Error: ${e.message}`);
    }

    console.log('\n--- Testing /webhook/documents ---');
    try {
        const d = await fetch('http://localhost:5678/webhook/documents');
        console.log(`  Status: ${d.status}`);
        const body = await d.text();
        console.log(`  Body: ${body.slice(0, 500)}`);
    } catch (e) {
        console.log(`  Error: ${e.message}`);
    }
}

main();
