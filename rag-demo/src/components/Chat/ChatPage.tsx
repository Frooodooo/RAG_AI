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
    const { sessions, activeSession, activeSessionId, createSession, selectSession, deleteSession, addMessage, clearSession } =
        useChatSessions()

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
            />

            {/* ── Chat Area ── */}
            <div className="flex flex-col flex-1 min-w-0 relative">
                {/* Chat header bar */}
                <div
                    className="flex items-center justify-between px-5 py-2.5 shrink-0"
                    style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            style={{ color: 'var(--text-accent)', flexShrink: 0 }}>
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <span
                            className="text-sm font-semibold truncate"
                            style={{ color: 'var(--text-primary)' }}
                            title={activeSession?.title}
                        >
                            {activeSession?.title ?? 'New Chat'}
                        </span>
                        {messages.length > 0 && (
                            <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                                · {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                            </span>
                        )}
                    </div>

                    {/* Clear session */}
                    {messages.length > 0 && (
                        <button
                            onClick={clearSession}
                            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all"
                            style={{
                                color: 'var(--text-muted)',
                                background: 'transparent',
                                border: '1px solid var(--border-subtle)',
                                cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--accent-rose)'
                                e.currentTarget.style.borderColor = 'var(--accent-rose)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--text-muted)'
                                e.currentTarget.style.borderColor = 'var(--border-subtle)'
                            }}
                            title="Clear this conversation"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6M14 11v6" />
                                <path d="M9 6V4h6v2" />
                            </svg>
                            {t('chat.clear') as string}
                        </button>
                    )}
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
                    <div className="w-full max-w-3xl mx-auto">
                        {messages.length === 0 ? (
                            /* Welcome Screen */
                            <div className="flex flex-col items-center justify-center min-h-[55vh] text-center opacity-0 animate-[fade-in-up_0.5s_ease-out_forwards]">
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                                    style={{ background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.25)' }}
                                >
                                    <RigaLogo size={32} />
                                </div>
                                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                    {t('chat.welcome_title') as string}
                                </h2>
                                <p className="max-w-sm text-sm mb-8 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                    {t('chat.welcome_desc') as string}
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl">
                                    {[1, 2, 3, 4].map((i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSend(t(`chat.starter_${i}` as any) as string)}
                                            disabled={loading}
                                            className="glass-card px-4 py-3 text-left text-sm transition-all hover:translate-y-[-2px] hover:shadow-lg group"
                                            style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
                                        >
                                            <span className="block text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-accent)' }}>
                                                {t('chat.try_asking') as string}
                                            </span>
                                            {t(`chat.starter_${i}` as any) as string}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg, idx) => (
                                    <div key={`${activeSessionId}-${idx}`} className="animate-[fade-in-up_0.3s_ease-out_forwards]">
                                        <ChatMessage message={msg} />
                                        {msg.role === 'ai' && msg.sources && msg.sources.length > 0 && (
                                            <SourcesPanel sources={msg.sources} />
                                        )}
                                    </div>
                                ))}

                                {/* Typing Indicator */}
                                {loading && (
                                    <div className="flex items-center gap-3 mb-6 animate-[fade-in-up_0.3s_ease-out_forwards]">
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
                                                    <span className="ml-1 font-mono">{elapsedSeconds}s</span>
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
