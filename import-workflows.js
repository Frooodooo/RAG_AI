const fs = require('fs');
const path = require('path');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlNTg0NGEwZC1hZDBiLTRmZGUtYmJlYy02OTAwZTYyZWQwN2QiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiM2IxYzBlMzgtYjU0MC00Y2MyLWEwN2YtZWFmZmVmMWI0ZjNjIiwiaWF0IjoxNzcxNDM4ODQ2LCJleHAiOjE3NzM5NTc2MDB9.Uvc93QLI1p8z7PNVjeI2e63aMakI7LsjBB9EZxhhAUQ';
const BASE = 'http://localhost:5678/api/v1';
const DIR = path.join(__dirname, 'n8n-workflows');

async function importWorkflow(file) {
    const data = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));

    // Create workflow
    const createRes = await fetch(`${BASE}/workflows`, {
        method: 'POST',
        headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!createRes.ok) {
        const text = await createRes.text();
        console.error(`  FAILED to create (${createRes.status}): ${text.slice(0, 200)}`);
        return null;
    }

    const wf = await createRes.json();
    console.log(`  Created: id=${wf.id}, name="${wf.name}"`);

    // Activate workflow
    const activateRes = await fetch(`${BASE}/workflows/${wf.id}/activate`, {
        method: 'POST',
        headers: { 'X-N8N-API-KEY': API_KEY },
    });

    if (activateRes.ok) {
        console.log(`  Activated!`);
    } else {
        const text = await activateRes.text();
        console.error(`  FAILED to activate (${activateRes.status}): ${text.slice(0, 200)}`);
    }

    return wf.id;
}

(async () => {
    const files = ['health.json', 'documents.json', 'chat.json', 'upload.json'];
    for (const file of files) {
        console.log(`\nImporting ${file}...`);
        await importWorkflow(file);
    }
    console.log('\nDone!');
})();
