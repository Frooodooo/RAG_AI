import { useState, useCallback, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
    type Message,
    type ChatSession,
    loadSessions,
    saveSessions,
} from './chatSessionStore'

const ACTIVE_KEY = 'rag-active-session'

function makeSession(): ChatSession {
    return {
        id: uuidv4(),
        title: 'New Chat',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
}

export function useChatSessions() {
    // Initialize from storage once.
    // If empty, create one session (persisted via useEffect later).
    const [sessions, setSessions] = useState<ChatSession[]>(() => {
        const loaded = loadSessions()
        return loaded.length > 0 ? loaded : [makeSession()]
    })

    // Initialize active session ID, potentially from storage, but validated against loaded sessions.
    const [activeSessionId, setActiveSessionIdState] = useState<string>(() => {
        const saved = localStorage.getItem(ACTIVE_KEY)
        if (saved && sessions.some((s) => s.id === saved)) return saved
        return sessions[0]?.id ?? ''
    })

    const setActiveSessionId = useCallback((id: string) => {
        setActiveSessionIdState(id)
        localStorage.setItem(ACTIVE_KEY, id)
    }, [])

    // Persist sessions whenever they change
    useEffect(() => {
        saveSessions(sessions)
    }, [sessions])

    // Ensure activeSessionId is valid. If the active session was deleted, switch to the first available one.
    useEffect(() => {
        if (!sessions.some((s) => s.id === activeSessionId)) {
            if (sessions.length > 0) {
                // eslint-disable-next-line
                setActiveSessionId(sessions[0].id)
            }
        }
    }, [sessions, activeSessionId, setActiveSessionId])

    const activeSession = sessions.find((s) => s.id === activeSessionId) ?? sessions[0] ?? makeSession()

    /** Create a new empty session and make it active. Returns its id. */
    const createSession = useCallback((): string => {
        const session = makeSession()
        setSessions((prev) => [session, ...prev])
        setActiveSessionId(session.id)
        return session.id
    }, [setActiveSessionId])

    /** Switch active session */
    const selectSession = useCallback(
        (id: string) => {
            setActiveSessionId(id)
        },
        [setActiveSessionId]
    )

    /** Delete a session. If it was active, switch to the next available one. */
    const deleteSession = useCallback(
        (id: string) => {
            setSessions((prev) => {
                const updated = prev.filter((s) => s.id !== id)
                return updated.length > 0 ? updated : [makeSession()]
            })
            // Note: Active session switch is handled by useEffect
        },
        [] // No dependencies needed! Stable callback.
    )

    /** Rename a session */
    const renameSession = useCallback((id: string, newTitle: string) => {
        const trimmed = newTitle.trim()
        if (!trimmed) return
        setSessions((prev) => prev.map((s) => {
            if (s.id !== id) return s
            return { ...s, title: trimmed, updatedAt: new Date().toISOString() }
        }))
    }, [])

    /** Append a message to the active session and persist. */
    const addMessage = useCallback(
        (message: Message) => {
            setSessions((prev) => prev.map((s) => {
                if (s.id !== activeSessionId) return s
                const messages = [...s.messages, message]
                // Auto-title from first user message (60 chars max)
                const isFirstUserMsg = s.messages.length === 0 && message.role === 'user'
                const title = isFirstUserMsg
                    ? message.content.slice(0, 60) + (message.content.length > 60 ? '…' : '')
                    : s.title
                return { ...s, messages, title, updatedAt: new Date().toISOString() }
            }))
        },
        [activeSessionId]
    )

    /** Clear all messages in the active session (keep session entry, reset title). */
    const clearSession = useCallback(() => {
        setSessions((prev) => prev.map((s) => {
            if (s.id !== activeSessionId) return s
            return { ...s, messages: [], title: 'New Chat', updatedAt: new Date().toISOString() }
        }))
    }, [activeSessionId])

    return {
        sessions,
        activeSession,
        activeSessionId,
        createSession,
        selectSession,
        deleteSession,
        renameSession,
        addMessage,
        clearSession,
    }
}
