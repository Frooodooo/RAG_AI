const API_KEY = process.env.N8N_API_KEY;
const BASE = process.env.N8N_BASE_URL || 'http://localhost:5678/api/v1';

if (!API_KEY) {
    console.error('Error: N8N_API_KEY environment variable is not set.');
    process.exit(1);
}

const headers = { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' };

async function main() {
    // List workflows
    const res = await fetch(`${BASE}/workflows`, { headers });
    const { data } = await res.json();

    for (const wf of data) {
        console.log(`\n${wf.name} (${wf.id}) - active: ${wf.active}`);

        // Deactivate
        const deact = await fetch(`${BASE}/workflows/${wf.id}/deactivate`, { method: 'POST', headers });
        console.log(`  Deactivate: ${deact.status}`);

        // Wait a moment
        await new Promise(r => setTimeout(r, 500));

        // Reactivate
        const act = await fetch(`${BASE}/workflows/${wf.id}/activate`, { method: 'POST', headers });
        console.log(`  Activate: ${act.status}`);

        if (!act.ok) {
            const text = await act.text();
            console.log(`  Error: ${text.slice(0, 300)}`);
        }
    }

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
