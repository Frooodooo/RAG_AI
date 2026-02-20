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

  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 180) + 'px'
    }
  }, [text])

  useEffect(() => { textareaRef.current?.focus() }, [])

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
  }

  const canSend = text.trim().length > 0 && !disabled

  return (
    <div style={{
      padding: '12px 20px 14px',
      borderTop: '1px solid var(--b1)',
      background: 'var(--bg-1)',
      flexShrink: 0,
    }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Input box */}
        <div className="chat-input-wrapper" style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '14px 18px' }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder') as string}
            aria-label={t('chat.placeholder') as string}
            disabled={disabled}
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: 'var(--t1)',
              fontFamily: 'var(--font)',
              fontSize: '16px',
              lineHeight: 1.6,
              minHeight: '32px',
              maxHeight: '200px',
            }}
          />

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={!canSend}
            title={t('chat.send') as string}
            aria-label={t('chat.send') as string}
            className={`
              w-12 h-12 rounded-[var(--r-md)] shrink-0 flex items-center justify-center border-none
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]
              transition-all duration-150 ease-[var(--ease)]
              enabled:cursor-pointer disabled:cursor-not-allowed
              enabled:shadow-[0_2px_12px_rgba(93,107,254,0.4)] disabled:shadow-none
              enabled:hover:translate-y-[-1px] enabled:hover:shadow-[0_4px_20px_rgba(93,107,254,0.5)]
              enabled:text-white disabled:text-[var(--t3)]
              enabled:bg-[linear-gradient(135deg,var(--accent)_0%,#7160fd_100%)] disabled:bg-[rgba(255,255,255,0.05)]
            `}
          >
            {disabled ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                role="status" aria-label={t('chat.thinking') as string}
                className="animate-spin">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>

        {/* Footer hint */}
        <p style={{
          textAlign: 'center', fontSize: '13px', marginTop: '8px',
          color: 'var(--t3)', opacity: 0.55, userSelect: 'none',
        }}>
          {t('chat.powered_by') as string}
          <span style={{ marginLeft: '8px', opacity: 0.7 }}>· Enter to send · Shift+Enter for newline</span>
        </p>
      </div>
    </div>
  )
}
