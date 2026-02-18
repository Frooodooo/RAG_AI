const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlNTg0NGEwZC1hZDBiLTRmZGUtYmJlYy02OTAwZTYyZWQwN2QiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiM2IxYzBlMzgtYjU0MC00Y2MyLWEwN2YtZWFmZmVmMWI0ZjNjIiwiaWF0IjoxNzcxNDM4ODQ2LCJleHAiOjE3NzM5NTc2MDB9.Uvc93QLI1p8z7PNVjeI2e63aMakI7LsjBB9EZxhhAUQ';
const BASE = 'http://localhost:5678/api/v1';
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
