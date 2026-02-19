const API_KEY = process.env.N8N_API_KEY;
const BASE = process.env.N8N_BASE_URL || 'http://localhost:5678/api/v1';

if (!API_KEY) {
    console.error('Error: N8N_API_KEY environment variable is not set.');
    process.exit(1);
}

const headers = { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' };

async function listCredentials() {
    try {
        const res = await fetch(`${BASE}/credentials`, { headers });
        if (!res.ok) {
            console.error(`Failed to list credentials: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.error(text);
            return;
        }
        const data = await res.json();
        console.log('Credentials:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

listCredentials();
