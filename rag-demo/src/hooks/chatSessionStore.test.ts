import { test, beforeEach } from 'node:test'
import assert from 'node:assert'
import { loadSessions, SESSIONS_KEY, type ChatSession } from './chatSessionStore.ts'

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
