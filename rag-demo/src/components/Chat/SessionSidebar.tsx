import { useState } from 'react'
import { useLocale } from '../../i18n'
import type { ChatSession } from '../../hooks/useChatSessions'

interface SessionSidebarProps {
    sessions: ChatSession[]
    activeSessionId: string
    onNew: () => void
    onSelect: (id: string) => void
    onDelete: (id: string) => void
}

function formatRelativeTime(iso: string): string {
    const now = Date.now()
    const then = new Date(iso).getTime()
    const diffMs = now - then
    const diffMin = Math.floor(diffMs / 60_000)
    const diffHr = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHr / 24)
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHr < 24) return `${diffHr}h ago`
    if (diffDay < 7) return `${diffDay}d ago`
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function SessionSidebar({
    sessions,
    activeSessionId,
    onNew,
    onSelect,
    onDelete,
}: SessionSidebarProps) {
    const { t } = useLocale()
    const [hovered, setHovered] = useState<string | null>(null)
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (confirmDelete === id) {
            onDelete(id)
            setConfirmDelete(null)
        } else {
            setConfirmDelete(id)
            // Auto-cancel confirm after 3s
            setTimeout(() => setConfirmDelete(null), 3000)
        }
    }

    return (
        <aside
            className="flex flex-col h-full"
            style={{
                width: '220px',
                minWidth: '220px',
                borderRight: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
            }}
        >
            {/* New Chat Button */}
            <div className="p-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <button
                    onClick={onNew}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all"
                    style={{
                        background: 'var(--accent-primary)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent-primary)')}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    {t('chat.new_chat') as string}
                </button>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto py-2">
                {sessions.length === 0 && (
                    <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>
                        No conversations yet
                    </p>
                )}
                {sessions.map((session) => {
                    const isActive = session.id === activeSessionId
                    const isHovered = hovered === session.id
                    const isConfirming = confirmDelete === session.id

                    return (
                        <div
                            key={session.id}
                            onClick={() => onSelect(session.id)}
                            onMouseEnter={() => setHovered(session.id)}
                            onMouseLeave={() => { setHovered(null); setConfirmDelete(null) }}
                            className="relative flex items-start gap-2 mx-2 mb-0.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all group"
                            style={{
                                background: isActive
                                    ? 'rgba(13, 148, 136, 0.15)'
                                    : isHovered
                                    ? 'rgba(255,255,255,0.04)'
                                    : 'transparent',
                                borderLeft: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                            }}
                        >
                            {/* Session icon */}
                            <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{ color: isActive ? 'var(--text-accent)' : 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }}
                            >
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>

                            {/* Session info */}
                            <div className="flex-1 min-w-0 pr-5">
                                <div
                                    className="text-xs font-medium truncate leading-tight"
                                    style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                                    title={session.title}
                                >
                                    {session.title}
                                </div>
                                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                    {session.messages.length > 0
                                        ? `${session.messages.length} msg · ${formatRelativeTime(session.updatedAt)}`
                                        : formatRelativeTime(session.createdAt)}
                                </div>
                            </div>

                            {/* Delete button */}
                            {(isHovered || isActive) && (
                                <button
                                    onClick={(e) => handleDelete(e, session.id)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded transition-all"
                                    style={{
                                        background: isConfirming ? 'var(--accent-rose)' : 'transparent',
                                        color: isConfirming ? 'white' : 'var(--text-muted)',
                                        border: 'none',
                                        cursor: 'pointer',
                                    }}
                                    title={isConfirming ? 'Click again to confirm' : 'Delete'}
                                    onMouseEnter={(e) => {
                                        if (!isConfirming) e.currentTarget.style.color = 'var(--accent-rose)'
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isConfirming) e.currentTarget.style.color = 'var(--text-muted)'
                                    }}
                                >
                                    {isConfirming ? (
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    ) : (
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    )}
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="px-3 py-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
                    {t('chat.history_saved') as string}
                </p>
            </div>
        </aside>
    )
}
