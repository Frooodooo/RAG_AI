import { useState } from 'react'
import RigaLogo from '../RigaLogo'
import type { Message } from '../../hooks/useChatSessions'

interface ChatMessageProps {
    message: Message
}

// ── Simple Markdown Renderer ─────────────────────────────────────────────────
// No external dependency — handles the most common AI response patterns.

function renderInline(text: string): React.ReactNode[] {
    // Pattern matches: **bold**, *italic*, `code`, ~~strikethrough~~
    const parts = text.split(/(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|`[^`\n]+?`|~~[^~\n]+?~~)/g)
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
            return <em key={i}>{part.slice(1, -1)}</em>
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
            return <code key={i} className="md-inline-code">{part.slice(1, -1)}</code>
        }
        if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
            return <del key={i}>{part.slice(2, -2)}</del>
        }
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

        // ── Fenced code block ──────────────────────────────────────────────
        if (line.startsWith('```')) {
            const lang = line.slice(3).trim() || 'code'
            const codeLines: string[] = []
            i++
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(lines[i])
                i++
            }
            i++ // skip closing ```
            elements.push(
                <CodeBlock key={key++} lang={lang} code={codeLines.join('\n')} />
            )
            continue
        }

        // ── Headings ───────────────────────────────────────────────────────
        const h3 = line.match(/^###\s+(.+)$/)
        const h2 = line.match(/^##\s+(.+)$/)
        const h1 = line.match(/^#\s+(.+)$/)
        if (h3) { elements.push(<h3 key={key++} className="md-h3">{renderInline(h3[1])}</h3>); i++; continue }
        if (h2) { elements.push(<h2 key={key++} className="md-h2">{renderInline(h2[1])}</h2>); i++; continue }
        if (h1) { elements.push(<h1 key={key++} className="md-h1">{renderInline(h1[1])}</h1>); i++; continue }

        // ── Horizontal rule ────────────────────────────────────────────────
        if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
            elements.push(<hr key={key++} className="md-hr" />)
            i++; continue
        }

        // ── Unordered list (collect consecutive items) ─────────────────────
        if (/^[-*+•]\s/.test(line)) {
            const items: string[] = []
            while (i < lines.length && /^[-*+•]\s/.test(lines[i])) {
                items.push(lines[i].replace(/^[-*+•]\s/, ''))
                i++
            }
            elements.push(
                <ul key={key++} className="md-ul">
                    {items.map((item, idx) => <li key={idx}>{renderInline(item)}</li>)}
                </ul>
            )
            continue
        }

        // ── Ordered list ──────────────────────────────────────────────────
        if (/^\d+\.\s/.test(line)) {
            const items: string[] = []
            while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
                items.push(lines[i].replace(/^\d+\.\s/, ''))
                i++
            }
            elements.push(
                <ol key={key++} className="md-ol">
                    {items.map((item, idx) => <li key={idx}>{renderInline(item)}</li>)}
                </ol>
            )
            continue
        }

        // ── Blockquote ─────────────────────────────────────────────────────
        if (line.startsWith('> ')) {
            const lines2: string[] = []
            while (i < lines.length && lines[i].startsWith('> ')) {
                lines2.push(lines[i].slice(2))
                i++
            }
            elements.push(
                <blockquote key={key++} className="md-blockquote">
                    {lines2.map((l, idx) => <p key={idx}>{renderInline(l)}</p>)}
                </blockquote>
            )
            continue
        }

        // ── Empty line ─────────────────────────────────────────────────────
        if (line.trim() === '') { i++; continue }

        // ── Regular paragraph (collect consecutive non-special lines) ──────
        const paraLines: string[] = []
        while (
            i < lines.length &&
            lines[i].trim() !== '' &&
            !lines[i].startsWith('```') &&
            !/^#{1,3}\s/.test(lines[i]) &&
            !/^[-*+•]\s/.test(lines[i]) &&
            !/^\d+\.\s/.test(lines[i]) &&
            !lines[i].startsWith('> ') &&
            !/^(-{3,}|_{3,}|\*{3,})$/.test(lines[i].trim())
        ) {
            paraLines.push(lines[i])
            i++
        }
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

// ── Code Block with Copy ─────────────────────────────────────────────────────
function CodeBlock({ lang, code }: { lang: string; code: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    return (
        <div className="md-code-block">
            <div className="md-code-header">
                <span className="md-code-lang">{lang}</span>
                <button className="md-copy-btn" onClick={handleCopy} title="Copy code">
                    {copied ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre className="md-code-pre"><code>{code}</code></pre>
        </div>
    )
}

// ── Main ChatMessage Component ────────────────────────────────────────────────
export default function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user'
    const [copied, setCopied] = useState(false)

    const time = new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    })

    const handleCopyMessage = () => {
        navigator.clipboard.writeText(message.content).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    return (
        <div className={`flex items-start gap-3 mb-5 group ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                    background: isUser ? 'var(--accent-primary)' : 'rgba(13,148,136,0.12)',
                    border: isUser ? 'none' : '1px solid rgba(13,148,136,0.25)',
                    boxShadow: isUser ? 'var(--shadow-sm)' : 'none',
                }}
            >
                {isUser ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                ) : (
                    <RigaLogo size={17} />
                )}
            </div>

            {/* Content */}
            <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[82%]`}>
                {/* Bubble */}
                <div
                    className="relative rounded-2xl px-5 py-3.5"
                    style={
                        isUser
                            ? {
                                  background: 'var(--bg-secondary)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-primary)',
                              }
                            : {
                                  background: 'transparent',
                                  color: 'var(--text-primary)',
                              }
                    }
                >
                    {isUser ? (
                        <div
                            style={{
                                fontSize: '14px',
                                lineHeight: '1.65',
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'var(--font-sans)',
                            }}
                        >
                            {message.content}
                        </div>
                    ) : (
                        renderMarkdown(message.content)
                    )}
                </div>

                {/* Meta row: timestamp + copy */}
                <div
                    className={`flex items-center gap-2 mt-1.5 px-1 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                    <span className="text-[11px] opacity-40 select-none" style={{ color: 'var(--text-muted)' }}>
                        {time}
                    </span>

                    {/* Copy button — visible on hover */}
                    <button
                        onClick={handleCopyMessage}
                        className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded transition-all opacity-0 group-hover:opacity-60 hover:!opacity-100"
                        style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                        title="Copy message"
                    >
                        {copied ? (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        ) : (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        )}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
            </div>
        </div>
    )
}
