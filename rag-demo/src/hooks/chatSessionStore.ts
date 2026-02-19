export interface Message {
    role: 'user' | 'ai'
    content: string
    timestamp: string // ISO string — survives JSON serialization
    sources?: Array<{ file: string; excerpt: string; score: number }>
}

export interface ChatSession {
    id: string
    title: string
    messages: Message[]
    createdAt: string
    updatedAt: string
}

export const SESSIONS_KEY = 'rag-chat-sessions'
export const MAX_SESSIONS = 50

export function loadSessions(): ChatSession[] {
    try {
        const raw = localStorage.getItem(SESSIONS_KEY)
        if (!raw) return []
        return JSON.parse(raw) as ChatSession[]
    } catch {
        return []
    }
}

export function saveSessions(sessions: ChatSession[]) {
    // Keep most recent sessions to avoid blowing up localStorage
    const trimmed = sessions.slice(0, MAX_SESSIONS)
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed))
}
