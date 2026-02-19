import axios from 'axios';

// EuroLLM-9B generates ~15-20 tok/s. 300 token response = ~20s. Set generous timeout.
const api = axios.create({
    timeout: 120_000,
    headers: {
        'Content-Type': 'application/json',
    },
});

const DOC_SERVER = '/doc-api';

/** POST /webhook/chat → {answer, sources[], executionId?} */
export async function sendChat(message: string, sessionId: string) {
    const { data } = await api.post<{
        answer: string;
        sources: Array<{ file: string; excerpt: string; score: number }>;
        executionId?: string;
    }>('/webhook/chat', { message, sessionId });
    return data;
}

/** POST /webhook/upload → upload doc as base64 JSON (NOT multipart — n8n bug #14876)
 *  Returns immediately with {id, processing: true} while n8n indexes in background.
 */
export async function uploadFileAPI(file: File) {
    const base64 = await fileToBase64(file);
    const { data } = await api.post<{
        success?: boolean;
        processing?: boolean;
        duplicate?: boolean;
        id: string;
        filename: string;
        message?: string;
    }>('/webhook/upload', {
        filename: file.name,
        fileBase64: base64,
        mimeType: file.type,
    });
    return data;
}

export interface ApiDocument {
    id: string;
    filename: string;
    /** Derived type: 'pdf' | 'docx' | 'xlsx' | 'document' */
    type: string;
    chunks: number;
    date: string;
    status: 'processing' | 'ready' | 'error';
    fileSize?: number;
    collection?: string;
    indexedAt?: string | null;
    error?: string | null;
}

/** GET http://localhost:3001/docs → ApiDocument[] */
export async function getDocs() {
    try {
        const { data } = await axios.get(`${DOC_SERVER}/docs`);
        // Map snake_case from doc-server to camelCase for frontend
        return Array.isArray(data) ? data.map((d: any) => ({
            id: d.id,
            filename: d.filename,
            type: d.mime_type, // or derive from filename
            chunks: d.chunks,
            date: d.uploaded_at,
            status: d.status,
            fileSize: d.file_size,
            collection: d.collection,
            indexedAt: d.indexed_at,
            error: d.error_message
        })) : [];
    } catch (error) {
        console.error('Failed to fetch documents:', error);
        throw error;
    }
}

export interface SearchResult {
    id: string;
    filename: string;
    status: string;
    chunks: number;
    excerpt: string;
    score: number;
}

/** POST http://localhost:3001/docs/search → SearchResult[]
 *  Full-text search over indexed document text.
 *  Pass docId to scope the search to a single document.
 */
export async function searchInDocs(query: string, docId?: string, limit = 10) {
    const { data } = await axios.post<SearchResult[]>(`${DOC_SERVER}/docs/search`, {
        query,
        docId: docId || null,
        limit,
    });
    return Array.isArray(data) ? data : [];
}

/** DELETE http://localhost:3001/docs/:id */
export async function deleteDoc(id: string) {
    const { data } = await axios.delete(`${DOC_SERVER}/docs/${id}`);
    return data;
}

// ---- n8n REST API ----

export interface N8nExecution {
    id: string;
    status: 'running' | 'success' | 'error' | 'waiting' | 'canceled';
    finished: boolean;
    data?: {
        resultData?: {
            runData?: Record<string, Array<{ startTime: number; executionTime: number; error?: unknown }>>;
        };
        executionData?: {
            nodeExecutionStack?: Array<{ node: { name: string } }>;
        };
    };
}

/** GET /n8n-api/executions/{id} — polls n8n execution status (API key injected by Vite proxy) */
export async function getExecution(executionId: string): Promise<N8nExecution> {
    const { data } = await api.get<N8nExecution>(`/n8n-api/executions/${executionId}`, {
        timeout: 10_000,
    });
    return data;
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
