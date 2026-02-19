import axios from 'axios';

// EuroLLM-9B generates ~15-20 tok/s. 300 token response = ~20s. Set generous timeout.
const api = axios.create({
    timeout: 120_000,
    headers: {
        'Content-Type': 'application/json',
    },
});

/** POST /webhook/chat → {answer, sources[]} */
export async function sendChat(message: string, sessionId: string) {
    const { data } = await api.post<{
        answer: string;
        sources: Array<{ file: string; excerpt: string; score: number }>;
    }>('/webhook/chat', { message, sessionId });
    return data;
}

/** POST /webhook/upload → upload doc as base64 JSON (NOT multipart — n8n bug #14876) */
export async function uploadFileAPI(file: File) {
    const base64 = await fileToBase64(file);
    const { data } = await api.post('/webhook/upload', {
        filename: file.name,
        fileBase64: base64,
        mimeType: file.type,
    });
    return data;
}

export interface ApiDocument {
    id: string;
    filename: string;
    type: string;
    chunks: number;
    date: string;
    status: string;
}

/** GET /webhook/documents → [{id, filename, type, chunks, date}] */
export async function getDocs() {
    try {
        const { data } = await api.get<ApiDocument[]>('/webhook/documents');
        return data;
    } catch (error) {
        console.error('Failed to fetch documents:', error);
        throw error;
    }
}

/** GET /webhook/health → {qdrant, ollama, n8n} */
export async function getHealth() {
    const { data } = await api.get<{
        qdrant: string;
        ollama: string;
        n8n: string;
    }>('/webhook/health');
    return data;
}

// ---- Helpers ----

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // readAsDataURL returns "data:mime;base64,XXXX" — we only want the XXXX part
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
