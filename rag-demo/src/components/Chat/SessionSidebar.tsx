import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocale } from '../../i18n'
import type { ChatSession } from '../../hooks/useChatSessions'

interface SessionSidebarProps {
    sessions: ChatSession[]
    activeSessionId: string
    onNew: () => void
    onSelect: (id: string) => void
    onDelete: (id: string) => void
    onRename: (id: string, newTitle: string) => void
}

const COLLAPSE_KEY = 'rag-sidebar-collapsed'

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

// ── Rename Input ──────────────────────────────────────────────────────────────
function RenameInput({
    initialValue,
    onCommit,
    onCancel,
}: {
    initialValue: string
    onCommit: (val: string) => void
    onCancel: () => void
}) {
    const [value, setValue] = useState(initialValue)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
    }, [])

    const commit = () => {
        const trimmed = value.trim()
        if (trimmed && trimmed !== initialValue) onCommit(trimmed)
        else onCancel()
    }

    return (
        <input
            ref={inputRef}
            className="session-rename-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); commit() }
                if (e.key === 'Escape') { e.preventDefault(); onCancel() }
            }}
            onClick={(e) => e.stopPropagation()}
            maxLength={80}
        />
    )
}

// ── Session Item ──────────────────────────────────────────────────────────────
function SessionItem({
    session,
    isActive,
    onSelect,
    onDelete,
    onRename,
}: {
    session: ChatSession
    isActive: boolean
    onSelect: () => void
    onDelete: () => void
    onRename: (title: string) => void
}) {
    const [isRenaming, setIsRenaming] = useState(false)
    const [deletePhase, setDeletePhase] = useState<'idle' | 'confirm'>('idle')
    const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Clean up timer on unmount
    useEffect(() => {
        return () => {
            if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current)
        }
    }, [])

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (deletePhase === 'confirm') {
            // Second click → actually delete
            if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current)
            setDeletePhase('idle')
            onDelete()
        } else {
            // First click → enter confirm phase with 4s timeout
            setDeletePhase('confirm')
            deleteTimerRef.current = setTimeout(() => setDeletePhase('idle'), 4000)
        }
    }

    const cancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current)
        setDeletePhase('idle')
    }

    return (
        <div
            role="listitem"
            tabIndex={0}
            onClick={() => { if (!isRenaming) onSelect() }}
            onDoubleClick={(e) => { e.preventDefault(); setIsRenaming(true) }}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    if (!isRenaming) onSelect()
                }
            }}
            className="group relative flex items-start gap-2.5 mx-1.5 mb-0.5 px-3 py-2.5 rounded-lg cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent-primary)]"
            style={{
                background: isActive
                    ? 'rgba(13, 148, 136, 0.18)'
                    : 'transparent',
                borderLeft: isActive
                    ? '2px solid var(--accent-primary)'
                    : '2px solid transparent',
                transition: 'background 150ms ease, border-color 150ms ease',
            }}
            onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
            }}
            onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
            }}
        >
            {/* Chat icon */}
            <svg
                width="13" height="13"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ color: isActive ? 'var(--text-accent)' : 'var(--text-muted)', flexShrink: 0, marginTop: '3px' }}
            >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>

            {/* Session info */}
            <div className="flex-1 min-w-0 pr-6">
                {isRenaming ? (
                    <RenameInput
                        initialValue={session.title}
                        onCommit={(val) => { onRename(val); setIsRenaming(false) }}
                        onCancel={() => setIsRenaming(false)}
                    />
                ) : (
                    <>
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
                    </>
                )}
            </div>

            {/* Action buttons — shown on hover or if confirming */}
            {!isRenaming && (
                <div
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1"
                    style={{
                        opacity: deletePhase === 'confirm' ? 1 : 0,
                        transition: 'opacity 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                        const parent = e.currentTarget.closest('[class*="group"]') as HTMLElement | null
                        if (!parent) return
                        // Show actions via CSS group hover via JS
                        ;(e.currentTarget as HTMLElement).style.opacity = '1'
                    }}
                >
                    {/* Force show via group hover workaround */}
                    <style>{`
                        .group:hover .action-btns, .group:focus-within .action-btns { opacity: 1 !important; }
                    `}</style>
                    <div className="action-btns flex items-center gap-1" style={{ opacity: deletePhase === 'confirm' ? 1 : undefined }}>
                        {deletePhase === 'confirm' ? (
                            <>
                                {/* Cancel */}
                                <button
                                    onClick={cancelDelete}
                                    title="Cancel"
                                    className="w-5 h-5 flex items-center justify-center rounded transition-all"
                                    style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}
                                >
                                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                                {/* Confirm delete */}
                                <button
                                    onClick={handleDeleteClick}
                                    title="Confirm delete"
                                    className="w-5 h-5 flex items-center justify-center rounded transition-all"
                                    style={{ background: 'var(--accent-rose)', color: 'white', border: 'none', cursor: 'pointer' }}
                                >
                                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleDeleteClick}
                                title="Delete conversation"
                                className="w-5 h-5 flex items-center justify-center rounded transition-all"
                                style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-rose)')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                            >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6l-1 14H6L5 6" />
                                    <path d="M9 6V4h6v2" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────
export default function SessionSidebar({
    sessions,
    activeSessionId,
    onNew,
    onSelect,
    onDelete,
    onRename,
}: SessionSidebarProps) {
    const { t } = useLocale()
    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem(COLLAPSE_KEY) === 'true'
    })
    const [search, setSearch] = useState('')

    const toggleCollapse = useCallback(() => {
        setCollapsed((c) => {
            const next = !c
            localStorage.setItem(COLLAPSE_KEY, String(next))
            return next
        })
    }, [])

    const filtered = search.trim()
        ? sessions.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))
        : sessions

    return (
        <aside className={`session-sidebar ${collapsed ? 'collapsed' : ''}`}>
            {/* ── Toggle + New Chat Row ── */}
            <div
                className="flex items-center gap-2 px-2 py-2.5 shrink-0"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
                {/* Collapse toggle */}
                <button
                    onClick={toggleCollapse}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-all shrink-0"
                    style={{
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                        e.currentTarget.style.color = 'var(--text-primary)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--text-muted)'
                    }}
                >
                    {/* Sidebar icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                </button>

                {/* New Chat button — only when expanded */}
                {!collapsed && (
                    <button
                        onClick={onNew}
                        title="New chat"
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all"
                        style={{
                            background: 'var(--accent-primary)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-secondary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent-primary)')}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        {t('chat.new_chat') as string}
                    </button>
                )}

                {/* When collapsed, New Chat is just an icon */}
                {collapsed && (
                    <button
                        onClick={onNew}
                        title="New chat"
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all shrink-0"
                        style={{
                            background: 'var(--accent-primary)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-secondary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent-primary)')}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* ── Expanded content ── */}
            <div className="session-sidebar-body">
                {/* Search */}
                {sessions.length > 3 && (
                    <div className="px-2 pt-2 pb-1">
                        <div
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}
                        >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search…"
                                className="flex-1 bg-transparent border-none outline-none text-xs"
                                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                                >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Session List */}
                <div role="list" className="flex-1 overflow-y-auto py-1.5">
                    {filtered.length === 0 && (
                        <p className="text-xs text-center py-8 px-3" style={{ color: 'var(--text-muted)' }}>
                            {search ? 'No conversations found' : 'No conversations yet'}
                        </p>
                    )}
                    {filtered.map((session) => (
                        <SessionItem
                            key={session.id}
                            session={session}
                            isActive={session.id === activeSessionId}
                            onSelect={() => onSelect(session.id)}
                            onDelete={() => onDelete(session.id)}
                            onRename={(title) => onRename(session.id, title)}
                        />
                    ))}
                </div>

                {/* Footer */}
                <div className="px-3 py-2 shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
                        {t('chat.history_saved') as string}
                        {sessions.length > 0 && (
                            <span className="ml-1 opacity-60">· {sessions.length}</span>
                        )}
                    </p>
                </div>
            </div>
        </aside>
    )
}
