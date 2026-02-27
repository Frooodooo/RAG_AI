import { useState, memo, useMemo } from 'react'
import type { Message } from '../../hooks/useChatSessions'

// ── Inline markdown renderer ─────────────────────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|`[^`\n]+?`|~~[^~\n]+?~~)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4)
      return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
      return <em key={i}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2)
      return <code key={i} className="md-inline-code">{part.slice(1, -1)}</code>
    if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4)
      return <del key={i}>{part.slice(2, -2)}</del>
    return <span key={i}>{part}</span>
  })
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || 'code'
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++ }
      i++
      elements.push(<CodeBlock key={key++} lang={lang} code={codeLines.join('\n')} />)
      continue
    }

    const h3 = line.match(/^###\s+(.+)$/); const h2 = line.match(/^##\s+(.+)$/); const h1 = line.match(/^#\s+(.+)$/)
    if (h3) { elements.push(<h3 key={key++} className="md-h3">{renderInline(h3[1])}</h3>); i++; continue }
    if (h2) { elements.push(<h2 key={key++} className="md-h2">{renderInline(h2[1])}</h2>); i++; continue }
    if (h1) { elements.push(<h1 key={key++} className="md-h1">{renderInline(h1[1])}</h1>); i++; continue }

    if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
      elements.push(<hr key={key++} className="md-hr" />); i++; continue
    }

    if (/^[-*+•]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*+•]\s/.test(lines[i])) { items.push(lines[i].replace(/^[-*+•]\s/, '')); i++ }
      elements.push(<ul key={key++} className="md-ul">{items.map((item, idx) => <li key={idx}>{renderInline(item)}</li>)}</ul>)
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s/, '')); i++ }
      elements.push(<ol key={key++} className="md-ol">{items.map((item, idx) => <li key={idx}>{renderInline(item)}</li>)}</ol>)
      continue
    }

    if (line.startsWith('> ')) {
      const bqLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) { bqLines.push(lines[i].slice(2)); i++ }
      elements.push(
        <blockquote key={key++} className="md-blockquote">
          {bqLines.map((l, idx) => <p key={idx}>{renderInline(l)}</p>)}
        </blockquote>
      )
      continue
    }

    if (line.trim() === '') { i++; continue }

    const paraLines: string[] = []
    while (
      i < lines.length && lines[i].trim() !== '' &&
      !lines[i].startsWith('```') && !/^#{1,3}\s/.test(lines[i]) &&
      !/^[-*+•]\s/.test(lines[i]) && !/^\d+\.\s/.test(lines[i]) &&
      !lines[i].startsWith('> ') && !/^(-{3,}|_{3,}|\*{3,})$/.test(lines[i].trim())
    ) { paraLines.push(lines[i]); i++ }

    if (paraLines.length > 0) {
      elements.push(
        <p key={key++} className="md-p">
          {paraLines.flatMap((pl, idx) => [
            ...(idx > 0 ? [<br key={`br-${idx}`} />] : []),
            ...renderInline(pl),
          ])}
        </p>
      )
    }
  }

  return <div className="md-body">{elements}</div>
}

// ── Code Block ───────────────────────────────────────────────────────────────
function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }
  return (
    <div className="md-code-block">
      <div className="md-code-header">
        <span className="md-code-lang">{lang}</span>
        <button className="md-copy-btn" onClick={handleCopy}>
          {copied
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="md-code-pre"><code>{code}</code></pre>
    </div>
  )
}

// ── Main ChatMessage Component ────────────────────────────────────────────────
function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  /* ── AI message content preparation ── */
  // Moved useMemo before conditional return to satisfy Rules of Hooks
  const renderedContent = useMemo(() => {
    if (isUser) return null
    return renderMarkdown(message.content)
  }, [message.content, isUser])

  /* ── User message ── */
  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }} className="group">
        <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{
            padding: '16px 22px',
            borderRadius: '18px 18px 4px 18px',
            background: 'linear-gradient(135deg, var(--accent) 0%, #7160fd 100%)',
            color: 'white',
            fontSize: '16px',
            lineHeight: 1.65,
            whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font)',
            boxShadow: '0 2px 16px rgba(93,107,254,0.3)',
          }}>
            {message.content}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', padding: '0 4px', flexDirection: 'row-reverse' }}>
            <span style={{ fontSize: '13px', color: 'var(--t3)', opacity: 0.7 }}>{time}</span>
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-150 hover:bg-[rgba(255,255,255,0.06)]"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', padding: '2px 6px', borderRadius: 'var(--r-xs)',
                color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer',
              }}
              title="Copy"
              aria-label="Copy user message"
            >
              {copied
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── AI message ── */
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px', width: '100%' }} className="group">
      {/* Avatar */}
      <div style={{
        width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
        background: 'linear-gradient(135deg, rgba(93,107,254,0.22) 0%, rgba(167,139,250,0.15) 100%)',
        border: '1px solid rgba(93,107,254,0.28)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="1.8">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {renderedContent}

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--t3)', opacity: 0.6 }}>{time}</span>
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-150 hover:bg-[rgba(255,255,255,0.05)]"
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '11px', padding: '2px 6px', borderRadius: 'var(--r-xs)',
              color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer',
            }}
            title="Copy"
            aria-label="Copy AI response"
          >
            {copied
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Memoized to prevent re-rendering all messages when the parent ChatPage updates (e.g. during typing animation)
export default memo(ChatMessage)
