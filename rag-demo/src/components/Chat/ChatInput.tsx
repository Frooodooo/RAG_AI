import { useState, useRef, useEffect } from 'react'
import { useLocale } from '../../i18n'

interface ChatInputProps {
    onSend: (message: string) => void
    disabled?: boolean
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
    const { t } = useLocale()
    const [text, setText] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current
        if (el) {
            el.style.height = 'auto'
            el.style.height = Math.min(el.scrollHeight, 180) + 'px'
        }
    }, [text])

    // Focus input on mount
    useEffect(() => {
        textareaRef.current?.focus()
    }, [])

    const handleSubmit = () => {
        const trimmed = text.trim()
        if (!trimmed || disabled) return
        onSend(trimmed)
        setText('')
        // Reset height after clearing
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter to send; Shift+Enter for new line
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const canSend = text.trim().length > 0 && !disabled

    return (
        <div
            className="px-4 pb-4 pt-3 shrink-0"
            style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}
        >
            <div className="w-full max-w-3xl mx-auto">
                {/* Input container */}
                <div className="chat-input-wrapper flex items-end gap-2 px-4 py-3">
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('chat.placeholder') as string}
                        disabled={disabled}
                        rows={1}
                        className="flex-1 bg-transparent border-none outline-none resize-none"
                        style={{
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            minHeight: '24px',
                            maxHeight: '180px',
                        }}
                    />

                    {/* Send Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={!canSend}
                        title={t('chat.send') as string}
                        className="flex items-center justify-center rounded-xl shrink-0 transition-all"
                        style={{
                            width: '36px',
                            height: '36px',
                            background: canSend ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)',
                            color: canSend ? 'white' : 'var(--text-muted)',
                            border: 'none',
                            cursor: canSend ? 'pointer' : 'not-allowed',
                            boxShadow: canSend ? '0 2px 8px rgba(13,148,136,0.35)' : 'none',
                            transform: 'translateY(0)',
                            transition: 'all 150ms ease',
                        }}
                        onMouseEnter={(e) => {
                            if (canSend) {
                                e.currentTarget.style.background = 'var(--accent-secondary)'
                                e.currentTarget.style.transform = 'translateY(-1px)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (canSend) {
                                e.currentTarget.style.background = 'var(--accent-primary)'
                                e.currentTarget.style.transform = 'translateY(0)'
                            }
                        }}
                    >
                        {disabled ? (
                            /* Spinner while loading */
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                style={{ animation: 'spin 1s linear infinite' }}>
                                <path d="M21 12a9 9 0 11-6.219-8.56" />
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Footer hint */}
                <p className="text-center text-[11px] mt-2 select-none" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                    {t('chat.powered_by') as string}
                    <span className="ml-2 opacity-70">· Enter to send · Shift+Enter for new line</span>
                </p>
            </div>

            {/* Spinner keyframe */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
