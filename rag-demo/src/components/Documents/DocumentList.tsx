import { format } from 'date-fns'
import { useLocale } from '../../i18n'

interface Document {
    id: string
    filename: string
    type: string
    date?: string
    status?: string
}

interface DocumentListProps {
    documents: Document[]
    loading: boolean
}

export default function DocumentList({ documents, loading }: DocumentListProps) {
    const { t } = useLocale()

    if (loading) {
        return (
            <div className="glass-card p-12 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-sm opacity-70" style={{ color: 'var(--text-muted)' }}>{t('docs.loading') as string}</p>
            </div>
        )
    }

    if (documents.length === 0) {
        return (
            <div className="glass-card p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-3xl opacity-50">
                    📄
                </div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('docs.empty') as string}</p>
            </div>
        )
    }

    return (
        <div className="glass-card overflow-hidden rounded-xl">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
                        <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                            {t('docs.col_name') as string}
                        </th>
                        <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                            {t('docs.col_type') as string}
                        </th>
                        <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                            {t('docs.col_date') as string}
                        </th>
                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: 'var(--text-secondary)' }}>
                            {t('docs.col_status') as string}
                        </th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {documents.map((doc, idx) => {
                        const ext = doc.filename.split('.').pop()?.toLowerCase() || 'txt'
                        let badgeClass = 'badge-processing'
                        if (ext === 'pdf') badgeClass = 'badge-pdf'
                        if (ext === 'docx') badgeClass = 'badge-docx'
                        if (ext === 'xlsx') badgeClass = 'badge-xlsx'

                        return (
                            <tr
                                key={idx}
                                className="group transition-colors hover:bg-white/5"
                                style={{ borderBottom: '1px solid var(--border-subtle)' }}
                            >
                                <td className="p-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-xs uppercase font-bold text-white/50">
                                            {ext}
                                        </div>
                                        {doc.filename}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`badge ${badgeClass}`}>
                                        {ext.toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-4 opacity-70" style={{ color: 'var(--text-secondary)' }}>
                                    {doc.date ? format(new Date(doc.date), 'MMM d, yyyy') : 'Just now'}
                                </td>
                                <td className="p-4 text-right">
                                    <span className="badge badge-ok">Indexed</span>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
