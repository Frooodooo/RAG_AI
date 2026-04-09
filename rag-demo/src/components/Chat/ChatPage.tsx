import { useRef, useEffect, useState } from 'react'
import { sendChat } from '../../api'
import { useLocale } from '../../i18n'
import { useChatSessions } from '../../hooks/useChatSessions'
import ChatInput from './ChatInput'
import ChatMessage from './ChatMessage'
import SourcesPanel from './SourcesPanel'
import SessionSidebar from './SessionSidebar'
import { ChatBubbleIcon, EditIcon, TrashIcon } from '../Icons'
import { ThinkingIndicator } from './ThinkingIndicator'

interface ChatPageProps {
  onProcessingChange?: (isProcessing: boolean) => void
  onExecution?: (executionId: string) => void
}

export default function ChatPage({ onProcessingChange, onExecution }: ChatPageProps) {
  const { t } = useLocale()
  const {
    sessions, activeSession, activeSessionId,
    createSession, selectSession, deleteSession,
    renameSession, addMessage, clearSession,
  } = useChatSessions()

  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { onProcessingChange?.(loading) }, [loading, onProcessingChange])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages, loading])

  const handleSend = async (text: string) => {
    addMessage({ role: 'user', content: text, timestamp: new Date().toISOString() })
    setLoading(true)
    try {
      const response = await sendChat(text, activeSessionId)
      if (response.executionId) onExecution?.(response.executionId)
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
          title={activeSession?.title ?? (t('chat.new_chat') as string)}
          messageCount={messages.length}
          onClear={() => { if (window.confirm(t('chat.confirm_clear') as string)) clearSession(); }}
          onRename={(title) => renameSession(activeSessionId, title)}
          t={t}
        />

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 20px 12px' }}>
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
                {loading && <ThinkingIndicator />}
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
        <ChatBubbleIcon width="16" height="16" stroke="var(--t-accent)" strokeWidth="2" style={{ flexShrink: 0 }} />

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
              flex: 1, minWidth: 0, fontSize: '16px', fontWeight: 600,
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
            <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--t1)', maxWidth: '420px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title}
            </span>
            <EditIcon width="14" height="14" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--t3)', opacity: 0.5, flexShrink: 0 }} />
          </button>
        )}

        {messageCount > 0 && !isRenaming && (
          <span style={{ fontSize: '13px', color: 'var(--t3)', flexShrink: 0 }}>
            · {messageCount} msg
          </span>
        )}
      </div>

      {messageCount > 0 && (
        <button
          onClick={onClear}
          className="btn btn-ghost"
          style={{ fontSize: '14px', padding: '6px 14px', marginLeft: '12px', flexShrink: 0 }}
          title="Clear conversation"
        >
          <TrashIcon width="14" height="14" stroke="currentColor" strokeWidth="2" />
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
      {/* Rīga Logo */}
      <div style={{
        width: '160px', height: '160px', borderRadius: '32px', marginBottom: '28px',
        background: 'linear-gradient(135deg, rgba(93,107,254,0.2) 0%, rgba(167,139,250,0.15) 100%)',
        border: '1px solid rgba(93,107,254,0.25)',
        boxShadow: '0 0 80px rgba(93,107,254,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <img
          src="/riga-logo-full.png"
          alt="Rīgas pašvaldība"
          style={{
            width: '120px',
            height: 'auto',
            filter: 'invert(1) brightness(100%)',
            opacity: 0.92,
          }}
        />
      </div>

      <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.03em', marginBottom: '12px' }}>
        {t('chat.welcome_title') as string}
      </h2>
      <p style={{ maxWidth: '480px', fontSize: '18px', color: 'var(--t2)', lineHeight: 1.65, marginBottom: '40px' }}>
        {t('chat.welcome_desc') as string}
      </p>

      {/* Starter question chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', width: '100%', maxWidth: '800px' }}>
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
        w-full text-left p-[20px_24px] rounded-[var(--r-lg)] border border-[var(--b1)] bg-[var(--bg-2)]
        transition-all duration-[180ms] ease-[var(--ease)] [font-family:var(--font)]
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]
        disabled:cursor-not-allowed disabled:opacity-50
        enabled:hover:border-[rgba(93,107,254,0.3)] enabled:hover:bg-[var(--bg-3)]
        enabled:hover:-translate-y-[2px] enabled:hover:shadow-[0_4px_20px_rgba(93,107,254,0.1)]
        cursor-pointer
      `}
    >
      <span className="block text-[14px] font-bold uppercase tracking-[0.07em] text-[var(--t-accent)] mb-[8px]">
        {label}
      </span>
      <span className="text-[17px] text-[var(--t2)] leading-[1.5]">
        {text}
      </span>
    </button>
  )
}
