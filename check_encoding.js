const http = require('http');
const fs = require('fs');

const docId = 'cd83ac57-1807-4aa2-9c79-bdb16085a5f6';
const url = `http://localhost:3001/docs/${docId}/text`;

console.log(`Fetching text for doc ${docId}...`);

http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const text = json.text || '';
            console.log(`Received ${text.length} characters.`);

            // Check for specific corrupted sequences
            // "finansējums" -> "finansÄjums" (C5 86 -> C3 84 C2 86 if double encoded?)
            // Actually "ē" is C4 93 in UTF-8. 
            // "š" is C5 A1.
            // If interpreted as Windows-1252:
            // C4 -> Ä
            // 93 -> “ (smart quote) or similar

            // Let's print a snippet around "finans"
            const match = text.match(/.{0,20}finans.{0,20}/i);
            if (match) {
                console.log('Snippet found:', match[0]);
                console.log('Hex dump of snippet:');
                const snippet = match[0];
                for (let i = 0; i < snippet.length; i++) {
                    process.stdout.write(snippet.charCodeAt(i).toString(16).padStart(2, '0') + ' ');
                }
                console.log('\n');
            } else {
                console.log('"finans" not found in text.');
            }

            // Check for "Piešķirtais"
            // "ķ" is C4 B7
            const match2 = text.match(/.{0,20}Pie.{0,20}/i);
            if (match2) {
                console.log('Snippet 2 found:', match2[0]);
            }

        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.log('Raw data snippet:', data.substring(0, 100));
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
