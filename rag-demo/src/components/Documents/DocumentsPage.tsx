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
        // Trigger refresh of document list
        setRefreshKey((k) => k + 1)
    }, [])

    return (
        <div className="h-full overflow-y-auto px-6 py-6" style={{ background: 'var(--bg-primary)' }}>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        {t('docs.title') as string}
                    </h2>
                    <p className="text-sm opacity-80" style={{ color: 'var(--text-secondary)' }}>
                        {t('docs.description') as string}
                    </p>
                </div>

                <div className="grid gap-8">
                    <UploadZone onUploadComplete={handleUploadComplete} />
                    <DocumentList documents={documents || []} loading={isLoading} />
                </div>
            </div>
        </div>
    )
}
