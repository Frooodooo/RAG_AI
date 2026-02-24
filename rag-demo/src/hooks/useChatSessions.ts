import { useState, useCallback, useRef, useEffect } from 'react'
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
    const [sessions, setSessions] = useState<ChatSession[]>(() => {
        const loaded = loadSessions()
        if (loaded.length === 0) {
            const initial = makeSession()
            saveSessions([initial])
            return [initial]
        }
        return loaded
    })

    const [activeSessionId, setActiveSessionIdState] = useState<string>(() => {
        const loaded = loadSessions()
        const saved = localStorage.getItem(ACTIVE_KEY)
        if (saved && loaded.find((s) => s.id === saved)) return saved
        return loaded[0]?.id ?? ''
    })

    const setActiveSessionId = useCallback((id: string) => {
        setActiveSessionIdState(id)
        localStorage.setItem(ACTIVE_KEY, id)
    }, [])

    // Track activeSessionId in a ref to keep callbacks stable
    const activeSessionIdRef = useRef(activeSessionId)
    useEffect(() => {
        activeSessionIdRef.current = activeSessionId
    }, [activeSessionId])

    const activeSession = sessions.find((s) => s.id === activeSessionId) ?? sessions[0] ?? makeSession()

    /** Create a new empty session and make it active. Returns its id. */
    const createSession = useCallback((): string => {
        const session = makeSession()
        setSessions((prev) => {
            const updated = [session, ...prev]
            saveSessions(updated)
            return updated
        })
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
                let updated = prev.filter((s) => s.id !== id)
                if (updated.length === 0) {
                    updated = [makeSession()]
                }
                saveSessions(updated)
                // Use ref to avoid dependency on activeSessionId
                if (id === activeSessionIdRef.current) {
                    setActiveSessionId(updated[0].id)
                }
                return updated
            })
        },
        [setActiveSessionId]
    )

    /** Rename a session */
    const renameSession = useCallback((id: string, newTitle: string) => {
        const trimmed = newTitle.trim()
        if (!trimmed) return
        setSessions((prev) => {
            const updated = prev.map((s) => {
                if (s.id !== id) return s
                return { ...s, title: trimmed, updatedAt: new Date().toISOString() }
            })
            saveSessions(updated)
            return updated
        })
    }, [])

    /** Append a message to the active session and persist. */
    const addMessage = useCallback(
        (message: Message) => {
            setSessions((prev) => {
                const currentId = activeSessionIdRef.current
                const updated = prev.map((s) => {
                    if (s.id !== currentId) return s
                    const messages = [...s.messages, message]
                    // Auto-title from first user message (60 chars max)
                    const isFirstUserMsg = s.messages.length === 0 && message.role === 'user'
                    const title = isFirstUserMsg
                        ? message.content.slice(0, 60) + (message.content.length > 60 ? '…' : '')
                        : s.title
                    return { ...s, messages, title, updatedAt: new Date().toISOString() }
                })
                saveSessions(updated)
                return updated
            })
        },
        []
    )

    /** Clear all messages in the active session (keep session entry, reset title). */
    const clearSession = useCallback(() => {
        setSessions((prev) => {
            const currentId = activeSessionIdRef.current
            const updated = prev.map((s) => {
                if (s.id !== currentId) return s
                return { ...s, messages: [], title: 'New Chat', updatedAt: new Date().toISOString() }
            })
            saveSessions(updated)
            return updated
        })
    }, [])

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
