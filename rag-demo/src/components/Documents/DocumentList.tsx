import { useState, useCallback, memo, useMemo } from 'react'
import { format } from 'date-fns'
import { useLocale } from '../../i18n'
import { deleteDoc, type ApiDocument } from '../../api'

/** Fetch-based download — catches server errors and surfaces them to the UI
 *  instead of letting Chrome show the confusing "download.htm - No file" error */
async function downloadDocFile(docId: string, filename: string): Promise<void> {
  const resp = await fetch(`/doc-api/docs/${docId}/download`)
  if (!resp.ok) {
    let msg = `Server returned ${resp.status}`
    try {
      const body = await resp.json()
      if (body?.error) msg = body.error
    } catch { /* ignore parse errors */ }
    throw new Error(msg)
  }
  const blob = await resp.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

interface DocumentListProps {
  documents: ApiDocument[]
  loading: boolean
  onDelete?: () => void
}

const EXT_COLORS: Record<string, { bg: string; color: string }> = {
  pdf: { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
  docx: { bg: 'rgba(56,189,248,0.12)', color: '#38bdf8' },
  xlsx: { bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
  document: { bg: 'rgba(255,255,255,0.06)', color: 'var(--t3)' },
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ready') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '2px 8px', borderRadius: '999px',
        fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
        background: 'rgba(52,211,153,0.12)', color: '#34d399',
        border: '1px solid rgba(52,211,153,0.25)',
      }}>
        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34d399', flexShrink: 0 }} />
        Ready
      </span>
    )
  }
  if (status === 'processing') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '2px 8px', borderRadius: '999px',
        fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
        background: 'rgba(251,191,36,0.12)', color: '#fbbf24',
        border: '1px solid rgba(251,191,36,0.25)',
      }}>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
        Indexing
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '2px 8px', borderRadius: '999px',
        fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
        background: 'rgba(248,113,113,0.12)', color: '#f87171',
        border: '1px solid rgba(248,113,113,0.25)',
      }}>
        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
        Error
      </span>
    )
  }
  return <span style={{ fontSize: '11px', color: 'var(--t3)' }}>{status}</span>
}

interface DocumentRowProps {
  doc: ApiDocument
  isDeleting: boolean
  isDownloading: boolean
  isLast: boolean
  onDelete: (id: string, e: React.MouseEvent) => void
  onDownload: (id: string, filename: string, e: React.MouseEvent) => void
}

const DocumentRow = memo(function DocumentRow({ doc, isDeleting, isDownloading, isLast, onDelete, onDownload }: DocumentRowProps) {
  const ext = doc.filename.split('.').pop()?.toLowerCase() || 'txt'
  const colors = EXT_COLORS[ext] || EXT_COLORS.document

  return (
    <div
      className="hover:bg-[rgba(255,255,255,0.02)] transition-[background] duration-[140ms]"
      style={{
        display: 'grid', gridTemplateColumns: '1fr 80px 80px 120px 100px 40px 40px', // Added column for download
        padding: '12px 16px', alignItems: 'center',
        borderBottom: isLast ? 'none' : '1px solid var(--b1)',
        opacity: isDeleting ? 0.4 : 1,
      }}
    >
      {/* Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: 'var(--r-sm)', flexShrink: 0,
          background: colors.bg, border: `1px solid ${colors.color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontSize: '9px', fontWeight: 800, textTransform: 'uppercase',
            color: colors.color, fontFamily: 'var(--font-mono)',
          }}>
            {ext}
          </span>
        </div>
        <div style={{ minWidth: 0 }}>
          <span style={{
            fontSize: '13px', fontWeight: 500, color: 'var(--t1)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            display: 'block',
          }} title={doc.filename}>
            {doc.filename}
          </span>
          {doc.fileSize != null && (
            <span style={{ fontSize: '11px', color: 'var(--t3)' }}>
              {(doc.fileSize / 1024).toFixed(0)} KB
            </span>
          )}
        </div>
      </div>

      {/* Type badge */}
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '2px 8px', borderRadius: '999px',
        fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
        background: colors.bg, color: colors.color,
        border: `1px solid ${colors.color}33`,
      }}>
        {ext.toUpperCase()}
      </span>

      {/* Chunks */}
      <span style={{ fontSize: '12px', color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
        {doc.status === 'processing'
          ? <span style={{ display: 'inline-block', opacity: 0.5 }}>…</span>
          : doc.chunks > 0 ? doc.chunks.toLocaleString() : '0'
        }
      </span>

      {/* Date */}
      <span style={{ fontSize: '12px', color: 'var(--t3)' }}>
        {doc.date ? format(new Date(doc.date), 'MMM d, yyyy') : 'Just now'}
      </span>

      {/* Status */}
      <div>
        <StatusBadge status={doc.status} />
      </div>

      {/* Download */}
      <button
        onClick={(e) => onDownload(doc.id, doc.filename, e)}
        disabled={isDownloading}
        title={isDownloading ? 'Downloading…' : 'Download document'}
        className="hover:bg-[rgba(255,255,255,0.05)] transition-all duration-[140ms]"
        style={{
          width: '28px', height: '28px', borderRadius: 'var(--r-sm)',
          background: 'transparent', border: '1px solid transparent',
          cursor: isDownloading ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--t3)', marginRight: '4px',
        }}
      >
        {isDownloading ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}
      </button>

      {/* Delete */}
      <button
        onClick={(e) => onDelete(doc.id, e)}
        disabled={isDeleting}
        title="Remove document"
        className="hover:bg-[rgba(248,113,113,0.12)] hover:border-[rgba(248,113,113,0.25)] hover:text-[#f87171] transition-all duration-[140ms]"
        style={{
          width: '28px', height: '28px', borderRadius: 'var(--r-sm)',
          background: 'transparent', border: '1px solid transparent',
          cursor: isDeleting ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--t3)',
        }}
      >
        {isDeleting ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        )}
      </button>
    </div>
  )
})

export default function DocumentList({ documents, loading, onDelete }: DocumentListProps) {
  const { t } = useLocale()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleDelete = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Remove this document from the index?')) return
    setDeletingId(id)
    try {
      await deleteDoc(id)
      onDelete?.()
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeletingId(null)
    }
  }, [onDelete])

  const handleDownload = useCallback(async (id: string, filename: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDownloadingId(id)
    setDownloadError(null)
    try {
      await downloadDocFile(id, filename)
    } catch (err: any) {
      const msg = err?.message || 'Download failed'
      setDownloadError(`${filename}: ${msg}`)
      setTimeout(() => setDownloadError(null), 6000)
    } finally {
      setDownloadingId(null)
    }
  }, [])

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return documents
    const q = searchQuery.toLowerCase()
    return documents.filter(d => d.filename.toLowerCase().includes(q))
  }, [documents, searchQuery])

  if (loading) {
    return (
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--b1)',
        borderRadius: 'var(--r-xl)', padding: '48px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          border: '2px solid var(--accent)', borderTopColor: 'transparent',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ fontSize: '13px', color: 'var(--t3)' }}>{t('docs.loading') as string}</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Download error toast */}
      {downloadError && (
        <div style={{
          background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.35)',
          borderRadius: 'var(--r-lg)', padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: '10px',
          fontSize: '13px', color: '#f87171',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Download failed — {downloadError}</span>
          <button onClick={() => setDownloadError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: '16px', lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{
          flex: 1,
          background: 'var(--bg-2)', border: '1px solid var(--b1)', borderRadius: 'var(--r-lg)',
          display: 'flex', alignItems: 'center', padding: '0 12px',
          height: '40px'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" style={{ marginRight: '8px' }}>
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Search documents"
            style={{
              background: 'transparent', border: 'none', color: 'var(--t1)',
              fontSize: '14px', width: '100%', outline: 'none'
            }}
          />
        </div>
      </div>

      {documents.length === 0 ? (
        <div style={{
          background: 'var(--bg-2)', border: '1px solid var(--b1)',
          borderRadius: 'var(--r-xl)', padding: '48px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
        }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--b1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--t3)' }}>{t('docs.empty') as string}</p>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-2)', border: '1px solid var(--b1)',
          borderRadius: 'var(--r-xl)', overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 80px 80px 120px 100px 40px 40px', // Added column for download
            padding: '10px 16px',
            borderBottom: '1px solid var(--b1)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            {([
              { id: 'name',   label: t('docs.col_name') },
              { id: 'type',   label: t('docs.col_type') },
              { id: 'chunks', label: t('docs.col_chunks') },
              { id: 'date',   label: t('docs.col_date') },
              { id: 'status', label: t('docs.col_status') },
              { id: 'dl',     label: '' },
              { id: 'del',    label: '' },
            ] as const).map(({ id, label }) => (
              <span key={id} style={{
                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: 'var(--t3)',
              }}>
                {label as string}
              </span>
            ))}
          </div>

          {/* Rows */}
          {filteredDocs.map((doc, idx) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              isDeleting={deletingId === doc.id}
              isDownloading={downloadingId === doc.id}
              isLast={idx === filteredDocs.length - 1}
              onDelete={handleDelete}
              onDownload={handleDownload}
            />
          ))}

          {filteredDocs.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--t3)', fontSize: '13px' }}>
              No matching documents found.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
