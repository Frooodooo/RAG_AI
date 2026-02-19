import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDocs } from '../../api'
import { useLocale } from '../../i18n'
import UploadZone from './UploadZone'
import DocumentList from './DocumentList'

export default function DocumentsPage() {
  const { t } = useLocale()
  const [refreshKey, setRefreshKey] = useState(0)

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', refreshKey],
    queryFn: getDocs,
    retry: 1,
  })

  const handleUploadComplete = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

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
        {documents && documents.length > 0 && (
          <div style={{ marginLeft: 'auto' }}>
            <span className="badge badge-accent">
              {documents.length} {documents.length === 1 ? 'document' : 'documents'}
            </span>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--bg-0)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <UploadZone onUploadComplete={handleUploadComplete} />
          <DocumentList documents={documents || []} loading={isLoading} />
        </div>
      </div>
    </div>
  )
}
