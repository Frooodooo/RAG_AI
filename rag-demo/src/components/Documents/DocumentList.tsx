import { format } from 'date-fns'
import { useLocale } from '../../i18n'

interface Document {
  id: string
  filename: string
  type: string
  date?: string
  status?: string
}

const EXT_COLORS: Record<string, { bg: string; color: string }> = {
  pdf:  { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
  docx: { bg: 'rgba(56,189,248,0.12)',  color: '#38bdf8' },
  xlsx: { bg: 'rgba(52,211,153,0.12)',  color: '#34d399' },
}

export default function DocumentList({ documents, loading }: { documents: Document[]; loading: boolean }) {
  const { t } = useLocale()

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

  if (documents.length === 0) {
    return (
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
    )
  }

  return (
    <div style={{
      background: 'var(--bg-2)', border: '1px solid var(--b1)',
      borderRadius: 'var(--r-xl)', overflow: 'hidden',
    }}>
      {/* Table header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 100px 120px 100px',
        padding: '10px 16px',
        borderBottom: '1px solid var(--b1)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        {(['docs.col_name', 'docs.col_type', 'docs.col_date', 'docs.col_status'] as const).map((key, i) => (
          <span key={i} style={{
            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: 'var(--t3)',
            textAlign: i === 3 ? 'right' : 'left',
          }}>
            {t(key) as string}
          </span>
        ))}
      </div>

      {/* Rows */}
      {documents.map((doc, idx) => {
        const ext = doc.filename.split('.').pop()?.toLowerCase() || 'txt'
        const colors = EXT_COLORS[ext] || { bg: 'rgba(255,255,255,0.06)', color: 'var(--t3)' }

        return (
          <div
            key={doc.id}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 100px 120px 100px',
              padding: '12px 16px', alignItems: 'center',
              borderBottom: idx < documents.length - 1 ? '1px solid var(--b1)' : 'none',
              transition: 'background 140ms',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            {/* Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: 'var(--r-sm)', flexShrink: 0,
                background: colors.bg, border: `1px solid ${colors.color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: colors.color, fontFamily: 'var(--font-mono)' }}>
                  {ext}
                </span>
              </div>
              <span style={{
                fontSize: '13px', fontWeight: 500, color: 'var(--t1)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }} title={doc.filename}>
                {doc.filename}
              </span>
            </div>

            {/* Type badge */}
            <div>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '2px 8px', borderRadius: '999px',
                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                background: colors.bg, color: colors.color,
                border: `1px solid ${colors.color}33`,
              }}>
                {ext.toUpperCase()}
              </span>
            </div>

            {/* Date */}
            <span style={{ fontSize: '12px', color: 'var(--t3)' }}>
              {doc.date ? format(new Date(doc.date), 'MMM d, yyyy') : 'Just now'}
            </span>

            {/* Status */}
            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-green">Indexed</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
