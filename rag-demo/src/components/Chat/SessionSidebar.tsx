import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react'
import { useLocale } from '../../i18n'
import { formatRelativeTime } from '../../utils/date'
import type { ChatSession } from '../../hooks/useChatSessions'
import { ChatBubbleIcon, XIcon, CheckIcon, TrashIcon, SidebarIcon, PlusIcon, SearchIcon } from '../Icons'

interface SessionSidebarProps {
    sessions: ChatSession[]
    activeSessionId: string
    onNew: () => void
    onSelect: (id: string) => void
    onDelete: (id: string) => void
    onRename: (id: string, newTitle: string) => void
}

const COLLAPSE_KEY = 'rag-sidebar-collapsed'

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
            aria-label="Rename conversation"
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
// Memoized to prevent unnecessary re-renders of the entire list when sidebar state (e.g. search) changes.
const SessionItem = memo(function SessionItem({
    session,
    isActive,
    onSelect,
    onDelete,
    onRename,
}: {
    session: ChatSession
    isActive: boolean
    onSelect: (id: string) => void
    onDelete: (id: string) => void
    onRename: (id: string, newTitle: string) => void
}) {
    const [isRenaming, setIsRenaming] = useState(false)
    const [deletePhase, setDeletePhase] = useState<'idle' | 'confirm'>('idle')
    const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const itemRef = useRef<HTMLDivElement>(null)

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
            onDelete(session.id)
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
            ref={itemRef}
            role="listitem"
            aria-selected={isActive}
            tabIndex={0}
            onClick={() => { if (!isRenaming) onSelect(session.id) }}
            onDoubleClick={(e) => { e.preventDefault(); setIsRenaming(true) }}
            onKeyDown={(e) => {
                // Ignore if event comes from a child interactive element
                if ((e.target as HTMLElement).closest('button, input')) return

                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    if (!isRenaming) onSelect(session.id)
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
            <ChatBubbleIcon
                width="16" height="16"
                style={{ color: isActive ? 'var(--text-accent)' : 'var(--text-muted)', flexShrink: 0, marginTop: '3px' }}
            />

            {/* Session info */}
            <div className="flex-1 min-w-0 pr-10">
                {isRenaming ? (
                    <RenameInput
                        initialValue={session.title}
                        onCommit={(val) => {
                            onRename(session.id, val)
                            setIsRenaming(false)
                            setTimeout(() => itemRef.current?.focus(), 0)
                        }}
                        onCancel={() => {
                            setIsRenaming(false)
                            setTimeout(() => itemRef.current?.focus(), 0)
                        }}
                    />
                ) : (
                    <>
                        <div
                            className="text-sm font-medium truncate leading-tight"
                            style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                            title={session.title}
                        >
                            {session.title}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
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
                    className={`absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity duration-150 ease-out ${deletePhase === 'confirm'
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
                        }`}
                    style={{ background: 'var(--bg-1)', borderRadius: '6px', padding: '2px' }}
                >
                    <div className="action-btns flex items-center gap-1">
                        {deletePhase === 'confirm' ? (
                            <>
                                {/* Cancel */}
                                <button
                                    onClick={cancelDelete}
                                    title="Cancel"
                                    aria-label="Cancel delete"
                                    className="w-7 h-7 flex items-center justify-center rounded transition-all"
                                    style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}
                                >
                                    <XIcon width="12" height="12" strokeWidth="2.5" aria-hidden="true" />
                                </button>
                                {/* Confirm delete */}
                                <button
                                    onClick={handleDeleteClick}
                                    title="Confirm delete"
                                    aria-label="Confirm delete"
                                    className="w-7 h-7 flex items-center justify-center rounded transition-all"
                                    style={{ background: 'var(--accent-rose)', color: 'white', border: 'none', cursor: 'pointer' }}
                                >
                                    <CheckIcon width="12" height="12" strokeWidth="3" aria-hidden="true" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleDeleteClick}
                                title="Delete conversation"
                                aria-label="Delete conversation"
                                className="w-7 h-7 flex items-center justify-center rounded transition-all"
                                style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-rose)')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                            >
                                <TrashIcon width="13" height="13" strokeWidth="2.5" aria-hidden="true" />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
})

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
    const searchInputRef = useRef<HTMLInputElement>(null)

    const toggleCollapse = useCallback(() => {
        setCollapsed((c) => {
            const next = !c
            localStorage.setItem(COLLAPSE_KEY, String(next))
            return next
        })
    }, [])

    // ⚡ Bolt: Memoized filtered sessions and hoisted toLowerCase() outside the loop
    // to prevent O(N) string conversions and recalculations on every render tick.
    const filtered = useMemo(() => {
        const trimmed = search.trim()
        if (!trimmed) return sessions
        const lowerSearch = trimmed.toLowerCase()
        return sessions.filter((s) => s.title.toLowerCase().includes(lowerSearch))
    }, [sessions, search])

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
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
                    <SidebarIcon width="20" height="20" strokeWidth="2" aria-hidden="true" />
                </button>

                {/* New Chat button — only when expanded */}
                {!collapsed && (
                    <button
                        onClick={onNew}
                        title="New chat"
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-sm font-semibold transition-all"
                        style={{
                            background: 'var(--accent-primary)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-secondary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent-primary)')}
                    >
                        <PlusIcon width="16" height="16" strokeWidth="2.5" aria-hidden="true" />
                        {t('chat.new_chat') as string}
                    </button>
                )}

                {/* When collapsed, New Chat is just an icon */}
                {collapsed && (
                    <button
                        onClick={onNew}
                        title="New chat"
                        aria-label={t('chat.new_chat') as string}
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
                        <PlusIcon width="16" height="16" strokeWidth="2.5" aria-hidden="true" />
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
                            <SearchIcon width="14" height="14" strokeWidth="2"
                                style={{ color: 'var(--text-muted)', flexShrink: 0 }} aria-hidden="true" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search…"
                                aria-label="Search conversations"
                                className="flex-1 bg-transparent border-none outline-none text-sm"
                                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
                            />
                            {search && (
                                <button
                                    onClick={() => {
                                        setSearch('')
                                        searchInputRef.current?.focus()
                                    }}
                                    title="Clear search"
                                    aria-label="Clear search"
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                                >
                                    <XIcon width="10" height="10" strokeWidth="2.5" />
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
                            onSelect={onSelect}
                            onDelete={onDelete}
                            onRename={onRename}
                        />
                    ))}
                </div>

                {/* Footer */}
                <div className="px-3 py-2 shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
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
