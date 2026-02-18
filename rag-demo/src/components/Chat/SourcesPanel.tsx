import { useState } from 'react'
import { useLocale } from '../../i18n'

interface Source {
    file: string
    excerpt: string
    score: number
}

interface SourcesPanelProps {
    sources: Source[]
}

export default function SourcesPanel({ sources }: SourcesPanelProps) {
    const { t } = useLocale()
    const [expanded, setExpanded] = useState(false)

    if (!sources || sources.length === 0) return null

    // Function to determine badge color based on match score
    const getScoreColor = (score: number) => {
        if (score > 0.8) return 'var(--accent-emerald)'
        if (score > 0.6) return 'var(--accent-amber)'
        return 'var(--text-muted)'
    }

    return (
        <div className="ml-12 mb-6 max-w-[700px]">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                style={{ color: 'var(--text-accent)', background: 'none', border: 'none', padding: '4px 0' }}
            >
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{
                        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                    }}
                >
                    <polyline points="9 18 15 12 9 6" />
                </svg>
                {/* Call the translation function with the number of sources */}
                {(t('chat.sources_found') as (n: number) => string)(sources.length)}
            </button>

            {expanded && (
                <div className="mt-3 grid gap-2 fade-in pl-5 border-l-2" style={{ borderColor: 'var(--border-subtle)' }}>
                    {sources.map((source, idx) => (
                        <div
                            key={idx}
                            className="glass-card px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                    {source.file}
                                </span>
                                <span
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/5"
                                    style={{ color: getScoreColor(source.score) }}
                                >
                                    {(source.score * 100).toFixed(0)}% {t('chat.match') as string}
                                </span>
                            </div>
                            <p className="text-[12px] leading-relaxed opacity-80 italic border-l-2 pl-3" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
                                "{source.excerpt}"
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
