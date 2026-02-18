import RigaLogo from '../RigaLogo'

interface ChatMessageProps {
    message: {
        role: 'user' | 'ai'
        content: string
        timestamp: Date
    }
}

export default function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user'
    const time = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    return (
        <div className={`flex items-start gap-4 mb-6 ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{
                    background: isUser ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                    border: isUser ? 'none' : '1px solid var(--border-subtle)',
                }}
            >
                {isUser ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" color="white">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                ) : (
                    <RigaLogo size={18} />
                )}
            </div>

            {/* Bubble */}
            <div
                className="relative max-w-[85%] w-fit rounded-2xl px-6 py-4 shadow-sm"
                style={{
                    background: isUser ? 'var(--bg-secondary)' : 'transparent',
                    color: 'var(--text-primary)',
                    border: isUser ? '1px solid var(--border-subtle)' : 'none',
                    // User bubble: standard dark card
                    // AI bubble: transparent, just text (cleaner reading experience)
                }}
            >
                <div
                    className="markdown-body"
                    style={{
                        fontSize: '15px',
                        lineHeight: '1.7',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'var(--font-sans)'
                    }}
                >
                    {message.content}
                </div>

                {/* Timestamp */}
                <div
                    className="text-[11px] mt-2 opacity-40 select-none"
                    style={{ textAlign: isUser ? 'right' : 'left' }}
                >
                    {time}
                </div>
            </div>
        </div>
    )
}
