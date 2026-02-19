import { useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getDocs } from '../../api'
import { useLocale } from '../../i18n'
import UploadZone from './UploadZone'
import DocumentList from './DocumentList'
import DocSearchPanel from './DocSearchPanel'

export default function DocumentsPage() {
  const { t } = useLocale()
  const queryClient = useQueryClient()
  const [showSearch, setShowSearch] = useState(false)

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: getDocs,
    retry: 1,
    // Poll every 5 seconds while any document is still processing
    refetchInterval: (query) => {
      const docs = query.state.data
      if (!docs) return false
      const hasProcessing = docs.some(d => d.status === 'processing')
      return hasProcessing ? 5000 : false
    },
  })

  const handleUploadComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['documents'] })
  }, [queryClient])

  const handleDelete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['documents'] })
  }, [queryClient])

  const totalChunks     = (documents || []).reduce((s, d) => s + (d.chunks || 0), 0)
  const readyCount      = (documents || []).filter(d => d.status === 'ready').length
  const processingCount = (documents || []).filter(d => d.status === 'processing').length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Page header */}
      <div style={{
        padding: '14px 24px',
        borderBottom: '1px solid var(--b1)',
        background: 'var(--bg-1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0,
      }}>
        <div style={{
          width: '28px', height: '28px',
          borderRadius: 'var(--r-sm)',
          background: 'var(--accent-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent-2)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.01em' }}>
            {t('docs.title') as string}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--t3)', marginTop: '1px' }}>
            {t('docs.description') as string}
          </p>
        </div>

        {/* Stats + search toggle */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {processingCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
              background: 'rgba(251,191,36,0.12)', color: '#fbbf24',
              border: '1px solid rgba(251,191,36,0.25)',
            }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              {processingCount} indexing
            </span>
          )}
          {readyCount > 0 && (
            <span className="badge badge-accent">
              {readyCount} {readyCount === 1 ? 'document' : 'documents'}
            </span>
          )}
          {totalChunks > 0 && (
            <span style={{
              fontSize: '11px', color: 'var(--t3)',
              padding: '3px 10px', borderRadius: '999px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--b1)',
            }}>
              {totalChunks.toLocaleString()} chunks
            </span>
          )}

          {(documents?.length ?? 0) > 0 && (
            <button
              onClick={() => setShowSearch(v => !v)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '4px 12px', borderRadius: 'var(--r-sm)', fontSize: '12px',
                background: showSearch ? 'var(--accent-dim)' : 'transparent',
                border: `1px solid ${showSearch ? 'var(--accent)' : 'var(--b1)'}`,
                color: showSearch ? 'var(--accent-2)' : 'var(--t2)',
                cursor: 'pointer', transition: 'all 140ms',
              }}
              title="Search within documents"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {t('docs.search_btn') as string}
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--bg-0)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <UploadZone onUploadComplete={handleUploadComplete} />

          {showSearch && (
            <DocSearchPanel documents={documents || []} />
          )}

          <DocumentList
            documents={documents || []}
            loading={isLoading}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  )
}
