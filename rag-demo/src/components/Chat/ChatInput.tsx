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
    <div
      className="p-[12px_20px_14px] border-t border-[var(--b1)] bg-[var(--bg-1)] shrink-0"
    >
      <div className="max-w-[960px] mx-auto">
        {/* Input box */}
        <div
          className="chat-input-wrapper flex items-end gap-3 p-[14px_18px]"
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder') as string}
            aria-label={t('chat.placeholder') as string}
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-[var(--t1)] [font-family:var(--font)] text-[16px] leading-[1.6] min-h-[32px] max-h-[200px]"
          />

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={!canSend}
            title={t('chat.send') as string}
            aria-label={t('chat.send') as string}
            className={`
              w-12 h-12 rounded-[var(--r-md)] shrink-0 flex items-center justify-center border-none
              transition-all duration-150 ease-[var(--ease)]
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]
              disabled:cursor-not-allowed disabled:bg-[rgba(255,255,255,0.05)] disabled:text-[var(--t3)] disabled:shadow-none
              enabled:cursor-pointer enabled:bg-[linear-gradient(135deg,var(--accent)_0%,#7160fd_100%)] enabled:text-white enabled:shadow-[0_2px_12px_rgba(93,107,254,0.4)]
              enabled:hover:-translate-y-px enabled:hover:shadow-[0_4px_20px_rgba(93,107,254,0.5)]
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
        <p className="text-center text-[13px] mt-2 text-[var(--t3)] opacity-55 select-none">
          {t('chat.powered_by') as string}
          <span className="ml-2 opacity-70">· Enter to send · Shift+Enter for newline</span>
        </p>
      </div>
    </div>
  )
}
