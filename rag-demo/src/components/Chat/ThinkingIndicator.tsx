import { useState, useEffect } from 'react'
import { useLocale } from '../../i18n'
import { StackIcon } from '../Icons'

export function ThinkingIndicator() {
  const { t } = useLocale()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', animation: 'fade-in-up 0.3s ease-out forwards' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, rgba(93,107,254,0.2), rgba(167,139,250,0.15))',
        border: '1px solid rgba(93,107,254,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <StackIcon width="14" height="14" stroke="var(--accent-2)" strokeWidth="2" />
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 16px', borderRadius: '16px',
        background: 'var(--bg-2)', border: '1px solid var(--b1)',
      }}>
        <span className="typing-dots"><span /><span /><span /></span>
        <span style={{ fontSize: '13px', color: 'var(--t3)' }}>
          {t('chat.thinking') as string}
          {elapsed > 0 && (
            <span style={{ marginLeft: '6px', fontFamily: 'var(--font-mono)', color: 'var(--t-accent)', fontSize: '12px' }}>
              {elapsed}s
            </span>
          )}
        </span>
      </div>
    </div>
  )
}
