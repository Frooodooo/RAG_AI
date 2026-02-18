import { useRef, useEffect, useState } from 'react'
import { sendChat } from '../../api'
import { useLocale } from '../../i18n'
import { useChatSessions } from '../../hooks/useChatSessions'
import ChatInput from './ChatInput'
import ChatMessage from './ChatMessage'
import SourcesPanel from './SourcesPanel'
import SessionSidebar from './SessionSidebar'
import RigaLogo from '../RigaLogo'

interface ChatPageProps {
    onProcessingChange?: (isProcessing: boolean) => void
}

export default function ChatPage({ onProcessingChange }: ChatPageProps) {
    const { t } = useLocale()
    const {
        sessions,
        activeSession,
        activeSessionId,
        createSession,
        selectSession,
        deleteSession,
        renameSession,
        addMessage,
        clearSession,
    } = useChatSessions()

    const [loading, setLoading] = useState(false)
    const [elapsedSeconds, setElapsedSeconds] = useState(0)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)

    // Elapsed time counter while loading
    useEffect(() => {
        if (loading) {
            setElapsedSeconds(0)
            timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [loading])

    // Notify parent about loading state
    useEffect(() => {
        onProcessingChange?.(loading)
    }, [loading, onProcessingChange])

    // Scroll to bottom on new message or loading change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [activeSession?.messages, loading])

    const handleSend = async (text: string) => {
        const userMsg = {
            role: 'user' as const,
            content: text,
            timestamp: new Date().toISOString(),
        }
        addMessage(userMsg)
        setLoading(true)

        try {
            const response = await sendChat(text, activeSessionId)
            const aiMsg = {
                role: 'ai' as const,
                content: response.answer,
                timestamp: new Date().toISOString(),
                sources: response.sources,
            }
            addMessage(aiMsg)
        } catch {
            addMessage({
                role: 'ai' as const,
                content: 'Atvainojiet, radās kļūda savienojumā ar serveri.\n\n*Sorry, a server connection error occurred.*',
                timestamp: new Date().toISOString(),
            })
        } finally {
            setLoading(false)
        }
    }

    const messages = activeSession?.messages ?? []

    return (
        <div className="flex h-full" style={{ background: 'var(--bg-primary)' }}>
            {/* ── Left Sidebar ── */}
            <SessionSidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                onNew={createSession}
                onSelect={selectSession}
                onDelete={deleteSession}
                onRename={renameSession}
            />

            {/* ── Chat Area ── */}
            <div className="flex flex-col flex-1 min-w-0 h-full">
                {/* Chat header bar */}
                <ChatHeader
                    title={activeSession?.title ?? 'New Chat'}
                    messageCount={messages.length}
                    onClear={clearSession}
                    onRename={(newTitle) => renameSession(activeSessionId, newTitle)}
                    t={t}
                />

                {/* Messages Area — centered content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="mx-auto w-full max-w-3xl px-4 py-6">
                        {messages.length === 0 ? (
                            /* Welcome Screen */
                            <WelcomeScreen loading={loading} onSend={handleSend} t={t} />
                        ) : (
                            <>
                                {messages.map((msg, idx) => (
                                    <div
                                        key={`${activeSessionId}-${idx}`}
                                        style={{ animation: 'fade-in-up 0.3s ease-out forwards' }}
                                    >
                                        <ChatMessage message={msg} />
                                        {msg.role === 'ai' && msg.sources && msg.sources.length > 0 && (
                                            <SourcesPanel sources={msg.sources} />
                                        )}
                                    </div>
                                ))}

                                {/* Typing Indicator */}
                                {loading && (
                                    <div
                                        className="flex items-center gap-3 mb-6"
                                        style={{ animation: 'fade-in-up 0.3s ease-out forwards' }}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                            style={{
                                                background: 'rgba(13,148,136,0.12)',
                                                border: '1px solid rgba(13,148,136,0.25)',
                                            }}
                                        >
                                            <RigaLogo size={16} />
                                        </div>
                                        <div
                                            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                                            style={{
                                                background: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-subtle)',
                                            }}
                                        >
                                            <span className="typing-dots">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </span>
                                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                                {t('chat.thinking') as string}
                                                {elapsedSeconds > 0 && (
                                                    <span className="ml-1.5 font-mono tabular-nums" style={{ color: 'var(--text-accent)' }}>
                                                        {elapsedSeconds}s
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div ref={bottomRef} />
                            </>
                        )}
                    </div>
                </div>

                {/* Input Area */}
                <ChatInput onSend={handleSend} disabled={loading} />
            </div>
        </div>
    )
}

// ── Chat Header ───────────────────────────────────────────────────────────────
function ChatHeader({
    title,
    messageCount,
    onClear,
    onRename,
    t,
}: {
    title: string
    messageCount: number
    onClear: () => void
    onRename: (newTitle: string) => void
    t: (key: any) => any
}) {
    const [isRenaming, setIsRenaming] = useState(false)
    const [renameVal, setRenameVal] = useState(title)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setRenameVal(title)
    }, [title])

    useEffect(() => {
        if (isRenaming) {
            inputRef.current?.focus()
            inputRef.current?.select()
        }
    }, [isRenaming])

    const commitRename = () => {
        const trimmed = renameVal.trim()
        if (trimmed && trimmed !== title) onRename(trimmed)
        setIsRenaming(false)
    }

    return (
        <div
            className="flex items-center justify-between px-4 py-2.5 shrink-0"
            style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', minHeight: '46px' }}
        >
            <div className="flex items-center gap-2 min-w-0 flex-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ color: 'var(--text-accent)', flexShrink: 0 }}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>

                {isRenaming ? (
                    <input
                        ref={inputRef}
                        value={renameVal}
                        onChange={(e) => setRenameVal(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); commitRename() }
                            if (e.key === 'Escape') { e.preventDefault(); setIsRenaming(false); setRenameVal(title) }
                        }}
                        maxLength={80}
                        className="flex-1 min-w-0 text-sm font-semibold bg-transparent outline-none border-b"
                        style={{
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-sans)',
                            borderColor: 'var(--border-active)',
                        }}
                    />
                ) : (
                    <button
                        onClick={() => setIsRenaming(true)}
                        title="Click to rename"
                        className="flex items-center gap-1.5 min-w-0 text-left"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                        <span
                            className="text-sm font-semibold truncate"
                            style={{ color: 'var(--text-primary)', maxWidth: '300px' }}
                            title={title}
                        >
                            {title}
                        </span>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            style={{ color: 'var(--text-muted)', flexShrink: 0, opacity: 0.5 }}>
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </button>
                )}

                {messageCount > 0 && !isRenaming && (
                    <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                        · {messageCount} {messageCount === 1 ? 'message' : 'messages'}
                    </span>
                )}
            </div>

            {/* Clear session */}
            {messageCount > 0 && (
                <button
                    onClick={onClear}
                    className="btn-ghost flex items-center gap-1.5 text-xs ml-3 shrink-0"
                    title="Clear this conversation"
                >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                    </svg>
                    {t('chat.clear') as string}
                </button>
            )}
        </div>
    )
}

// ── Welcome Screen ────────────────────────────────────────────────────────────
function WelcomeScreen({
    loading,
    onSend,
    t,
}: {
    loading: boolean
    onSend: (text: string) => void
    t: (key: any) => any
}) {
    return (
        <div
            className="flex flex-col items-center justify-center py-16 text-center"
            style={{ animation: 'fade-in-up 0.5s ease-out forwards' }}
        >
            {/* Icon */}
            <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{
                    background: 'rgba(13,148,136,0.1)',
                    border: '1px solid rgba(13,148,136,0.2)',
                    boxShadow: '0 0 40px rgba(13,148,136,0.1)',
                }}
            >
                <RigaLogo size={32} />
            </div>

            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {t('chat.welcome_title') as string}
            </h2>
            <p className="max-w-xs text-sm mb-10 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {t('chat.welcome_desc') as string}
            </p>

            {/* Starter questions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
                {[1, 2, 3, 4].map((i) => (
                    <button
                        key={i}
                        onClick={() => onSend(t(`chat.starter_${i}` as any) as string)}
                        disabled={loading}
                        className="glass-card px-4 py-3 text-left text-sm transition-all"
                        style={{
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 200ms ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(45,212,191,0.2)'
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(13,148,136,0.12)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = ''
                            e.currentTarget.style.transform = ''
                            e.currentTarget.style.boxShadow = ''
                        }}
                    >
                        <span
                            className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                            style={{ color: 'var(--text-accent)' }}
                        >
                            {t('chat.try_asking') as string}
                        </span>
                        {t(`chat.starter_${i}` as any) as string}
                    </button>
                ))}
            </div>
        </div>
    )
}
