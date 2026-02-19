import { test, beforeEach } from 'node:test'
import assert from 'node:assert'
import { loadSessions, saveSessions, SESSIONS_KEY, MAX_SESSIONS, type ChatSession } from './chatSessionStore.ts'

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString()
        },
        removeItem: (key: string) => {
            delete store[key]
        },
        clear: () => {
            store = {}
        },
    }
})()

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
})

beforeEach(() => {
    localStorage.clear()
})

test('loadSessions returns empty array when localStorage is empty', () => {
    const sessions = loadSessions()
    assert.deepStrictEqual(sessions, [])
})

test('saveSessions saves sessions to localStorage', () => {
    const mockSessions: ChatSession[] = [
        {
            id: '1',
            title: 'Test Session',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ]

    saveSessions(mockSessions)

    const stored = localStorage.getItem(SESSIONS_KEY)
    assert.notStrictEqual(stored, null)
    assert.deepStrictEqual(JSON.parse(stored!), mockSessions)
})

test('saveSessions trims sessions to MAX_SESSIONS', () => {
    const manySessions: ChatSession[] = Array.from({ length: MAX_SESSIONS + 10 }, (_, i) => ({
        id: i.toString(),
        title: `Session ${i}`,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }))

    saveSessions(manySessions)

    const stored = localStorage.getItem(SESSIONS_KEY)
    const parsed = JSON.parse(stored!) as ChatSession[]

    assert.strictEqual(parsed.length, MAX_SESSIONS)
    assert.deepStrictEqual(parsed, manySessions.slice(0, MAX_SESSIONS))
})

test('saveSessions handles empty array', () => {
    saveSessions([])
    const stored = localStorage.getItem(SESSIONS_KEY)
    assert.deepStrictEqual(JSON.parse(stored!), [])
})

test('saveSessions preserves complex object structure', () => {
    const complexSession: ChatSession = {
        id: 'complex-1',
        title: 'Complex Session',
        messages: [
            {
                role: 'user',
                content: 'Hello',
                timestamp: '2023-01-01T00:00:00.000Z',
            },
            {
                role: 'ai',
                content: 'Hi there',
                timestamp: '2023-01-01T00:00:01.000Z',
                sources: [
                    {
                        file: 'doc1.txt',
                        excerpt: 'Some text',
                        score: 0.9,
                    },
                ],
            },
        ],
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:01.000Z',
    }

    saveSessions([complexSession])

    const stored = localStorage.getItem(SESSIONS_KEY)
    const parsed = JSON.parse(stored!) as ChatSession[]
    assert.deepStrictEqual(parsed[0], complexSession)
})

test('saveSessions propagates localStorage errors', () => {
    const originalSetItem = localStorage.setItem
    // Mock setItem to throw
    localStorage.setItem = () => {
        throw new Error('QuotaExceededError')
    }

    try {
        assert.throws(() => saveSessions([]), {
            message: 'QuotaExceededError'
        })
    } finally {
        // Restore mock
        localStorage.setItem = originalSetItem
    }
})

test('loadSessions returns parsed sessions when valid JSON is present', () => {
    const mockSessions: ChatSession[] = [
        {
            id: '1',
            title: 'Test Session',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ]
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(mockSessions))

    const sessions = loadSessions()
    assert.deepStrictEqual(sessions, mockSessions)
})

test('loadSessions returns empty array when invalid JSON is present (error resilience)', () => {
    // Set invalid JSON
    localStorage.setItem(SESSIONS_KEY, 'invalid json {')

    // Should not throw and return empty array
    const sessions = loadSessions()
    assert.deepStrictEqual(sessions, [])
})
