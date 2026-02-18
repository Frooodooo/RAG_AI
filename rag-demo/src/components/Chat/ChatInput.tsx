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
            el.style.height = Math.min(el.scrollHeight, 160) + 'px'
        }
    }, [text])

    const handleSubmit = () => {
        const trimmed = text.trim()
        if (!trimmed || disabled) return
        onSend(trimmed)
        setText('')
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div
            className="px-4 py-4 border-t relative z-10"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-secondary)' }}
        >
            <div className="w-full max-w-5xl mx-auto">
                <div className="flex items-end gap-3 mb-2">
                    {/* Text Area */}
                    <div
                        className="flex-1 rounded-xl px-4 py-3 transition-colors focus-within:ring-1 focus-within:ring-teal-500/50"
                        style={{
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-subtle)'
                        }}
                    >
                        <textarea
                            ref={textareaRef}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t('chat.placeholder') as string}
                            disabled={disabled}
                            rows={1}
                            className="w-full bg-transparent border-none outline-none resize-none text-[15px]"
                            style={{
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--font-sans)',
                                lineHeight: '1.5',
                            }}
                        />
                    </div>

                    {/* Send Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={disabled || !text.trim()}
                        className="btn-primary px-4 py-3 rounded-xl h-[48px] aspect-square flex items-center justify-center shrink-0"
                        title={t('chat.send') as string}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </div>

                {/* Footer */}
                <p className="text-center text-[11px] opacity-40 select-none" style={{ color: 'var(--text-muted)' }}>
                    {t('chat.powered_by') as string}
                </p>
            </div>
        </div>
    )
}
