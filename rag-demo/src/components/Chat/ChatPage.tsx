import { useRef, useEffect, useState } from 'react'
import { sendChat } from '../../api'
import { useLocale } from '../../i18n'
import { useChatSessions } from '../../hooks/useChatSessions'
import ChatInput from './ChatInput'
import ChatMessage from './ChatMessage'
import SourcesPanel from './SourcesPanel'
import SessionSidebar from './SessionSidebar'

interface ChatPageProps {
  onProcessingChange?: (isProcessing: boolean) => void
}

export default function ChatPage({ onProcessingChange }: ChatPageProps) {
  const { t } = useLocale()
  const {
    sessions, activeSession, activeSessionId,
    createSession, selectSession, deleteSession,
    renameSession, addMessage, clearSession,
  } = useChatSessions()

  const [loading, setLoading] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (loading) {
      setElapsedSeconds(0)
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [loading])

  useEffect(() => { onProcessingChange?.(loading) }, [loading, onProcessingChange])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages, loading])

  const handleSend = async (text: string) => {
    addMessage({ role: 'user', content: text, timestamp: new Date().toISOString() })
    setLoading(true)
    try {
      const response = await sendChat(text, activeSessionId)
      addMessage({ role: 'ai', content: response.answer, timestamp: new Date().toISOString(), sources: response.sources })
    } catch {
      addMessage({ role: 'ai', content: 'Atvainojiet, radās kļūda savienojumā ar serveri.\n\n*Sorry, a server connection error occurred.*', timestamp: new Date().toISOString() })
    } finally {
      setLoading(false)
    }
  }

  const messages = activeSession?.messages ?? []

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-0)' }}>
      {/* ── Session Sidebar ── */}
      <SessionSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNew={createSession}
        onSelect={selectSession}
        onDelete={deleteSession}
        onRename={renameSession}
      />

      {/* ── Chat Main Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Chat subheader */}
        <ChatHeader
          title={activeSession?.title ?? 'New Chat'}
          messageCount={messages.length}
          onClear={clearSession}
          onRename={(title) => renameSession(activeSessionId, title)}
          t={t}
        />

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 20px 12px' }}>
            {messages.length === 0 ? (
              <WelcomeScreen loading={loading} onSend={handleSend} t={t} />
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div key={`${activeSessionId}-${idx}`} style={{ animation: 'fade-in-up 0.3s ease-out forwards' }}>
                    <ChatMessage message={msg} />
                    {msg.role === 'ai' && msg.sources && msg.sources.length > 0 && (
                      <SourcesPanel sources={msg.sources} />
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', animation: 'fade-in-up 0.3s ease-out forwards' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, rgba(93,107,254,0.2), rgba(167,139,250,0.15))',
                      border: '1px solid rgba(93,107,254,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 16px', borderRadius: '16px',
                      background: 'var(--bg-2)', border: '1px solid var(--b1)',
                    }}>
                      <span className="typing-dots"><span /><span /><span /></span>
                      <span style={{ fontSize: '13px', color: 'var(--t3)' }}>
                        {t('chat.thinking') as string}
                        {elapsedSeconds > 0 && (
                          <span style={{ marginLeft: '6px', fontFamily: 'var(--font-mono)', color: 'var(--t-accent)', fontSize: '12px' }}>
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

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={loading} />
      </div>
    </div>
  )
}

/* ── Chat Subheader ── */
function ChatHeader({ title, messageCount, onClear, onRename, t }: {
  title: string; messageCount: number
  onClear: () => void; onRename: (t: string) => void; t: (k: any) => any
}) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [val, setVal] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setVal(title) }, [title])
  useEffect(() => { if (isRenaming) { inputRef.current?.focus(); inputRef.current?.select() } }, [isRenaming])

  const commit = () => {
    const trimmed = val.trim()
    if (trimmed && trimmed !== title) onRename(trimmed)
    setIsRenaming(false)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 18px', flexShrink: 0,
      borderBottom: '1px solid var(--b1)', background: 'var(--bg-1)',
      minHeight: '48px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
        {/* Icon */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t-accent)" strokeWidth="2" style={{ flexShrink: 0 }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>

        {isRenaming ? (
          <input
            ref={inputRef}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commit() }
              if (e.key === 'Escape') { e.preventDefault(); setIsRenaming(false); setVal(title) }
            }}
            maxLength={80}
            style={{
              flex: 1, minWidth: 0, fontSize: '13px', fontWeight: 600,
              background: 'transparent', outline: 'none', color: 'var(--t1)',
              fontFamily: 'var(--font)', borderBottom: '1px solid var(--b-accent)',
            }}
          />
        ) : (
          <button
            onClick={() => setIsRenaming(true)}
            title="Click to rename"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title}
            </span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--t3)', opacity: 0.5, flexShrink: 0 }}>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}

        {messageCount > 0 && !isRenaming && (
          <span style={{ fontSize: '11px', color: 'var(--t3)', flexShrink: 0 }}>
            · {messageCount} msg
          </span>
        )}
      </div>

      {messageCount > 0 && (
        <button
          onClick={onClear}
          className="btn-ghost"
          style={{ fontSize: '12px', padding: '5px 11px', marginLeft: '12px', flexShrink: 0 }}
          title="Clear conversation"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
          </svg>
          {t('chat.clear') as string}
        </button>
      )}
    </div>
  )
}

/* ── Welcome Screen ── */
function WelcomeScreen({ loading, onSend, t }: { loading: boolean; onSend: (t: string) => void; t: (k: any) => any }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 20px 40px', textAlign: 'center',
      animation: 'fade-in-up 0.5s ease-out forwards',
    }}>
      {/* Hero icon */}
      <div style={{
        width: '72px', height: '72px', borderRadius: '20px', marginBottom: '24px',
        background: 'linear-gradient(135deg, rgba(93,107,254,0.2) 0%, rgba(167,139,250,0.15) 100%)',
        border: '1px solid rgba(93,107,254,0.25)',
        boxShadow: '0 0 60px rgba(93,107,254,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>

      <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.03em', marginBottom: '10px' }}>
        {t('chat.welcome_title') as string}
      </h2>
      <p style={{ maxWidth: '340px', fontSize: '14px', color: 'var(--t2)', lineHeight: 1.65, marginBottom: '36px' }}>
        {t('chat.welcome_desc') as string}
      </p>

      {/* Starter question chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', width: '100%', maxWidth: '560px' }}>
        {([1, 2, 3, 4] as const).map((i) => (
          <StarterChip key={i} text={t(`chat.starter_${i}` as any) as string} label={t('chat.try_asking') as string} disabled={loading} onSend={onSend} />
        ))}
      </div>
    </div>
  )
}

function StarterChip({ text, label, disabled, onSend }: { text: string; label: string; disabled: boolean; onSend: (t: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSend(text)}
      disabled={disabled}
      className={`
        w-full text-left p-[14px_16px] rounded-[var(--r-lg)] border border-[var(--b1)] bg-[var(--bg-2)]
        transition-all duration-[180ms] ease-[var(--ease)] [font-family:var(--font)]
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]
        disabled:cursor-not-allowed disabled:opacity-50
        enabled:hover:border-[rgba(93,107,254,0.3)] enabled:hover:bg-[var(--bg-3)]
        enabled:hover:-translate-y-[2px] enabled:hover:shadow-[0_4px_20px_rgba(93,107,254,0.1)]
        cursor-pointer
      `}
    >
      <span className="block text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--t-accent)] mb-[6px]">
        {label}
      </span>
      <span className="text-[13px] text-[var(--t2)] leading-[1.5]">
        {text}
      </span>
    </button>
  )
}
