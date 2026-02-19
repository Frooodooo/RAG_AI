import { useState } from 'react'
import { useLocale } from '../../i18n'

interface Source { file: string; excerpt: string; score: number }

export default function SourcesPanel({ sources }: { sources: Source[] }) {
  const { t } = useLocale()
  const [expanded, setExpanded] = useState(false)

  if (!sources || sources.length === 0) return null

  const getScore = (score: number) => {
    if (score > 0.8) return { color: 'var(--green)', label: 'High match' }
    if (score > 0.6) return { color: 'var(--amber)', label: 'Good match' }
    return { color: 'var(--t3)', label: 'Low match' }
  }

  return (
    <div style={{ marginLeft: '44px', marginBottom: '22px', maxWidth: '680px' }}>
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
          cursor: 'pointer', color: 'var(--t-accent)', background: 'none', border: 'none',
          padding: '3px 0', opacity: 0.75, transition: 'opacity 150ms',
          fontFamily: 'var(--font)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.75' }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 200ms' }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
        {/* sources_found is a function that takes a number */}
        {(t('chat.sources_found') as (n: number) => string)(sources.length)}
      </button>

      {expanded && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fade-in-up 0.25s ease-out forwards' }}>
          {sources.map((source, idx) => {
            const { color } = getScore(source.score)
            return (
              <div key={idx} style={{
                background: 'var(--bg-2)', border: '1px solid var(--b1)',
                borderRadius: 'var(--r-lg)', padding: '12px 14px',
                transition: 'border-color 150ms, background 150ms',
              }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.borderColor = 'var(--b2)'
                  el.style.background = 'var(--bg-3)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.borderColor = 'var(--b1)'
                  el.style.background = 'var(--bg-2)'
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 600, color: 'var(--t1)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    {source.file}
                  </span>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                    borderRadius: '999px', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)', color,
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {(source.score * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Excerpt */}
                <p style={{
                  fontSize: '12px', lineHeight: 1.65, color: 'var(--t2)',
                  fontStyle: 'italic', margin: 0,
                  borderLeft: '2px solid var(--b2)', paddingLeft: '10px',
                  opacity: 0.85,
                }}>
                  "{source.excerpt}"
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
