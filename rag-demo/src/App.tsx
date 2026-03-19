import { useState, useEffect, Suspense, lazy } from 'react'
import { getHealth } from './api'
import { useLocale, type Locale } from './i18n'
import ChatPage from './components/Chat/ChatPage'

// ⚡ Bolt: Code-split non-critical routes to reduce initial bundle size and speed up TTI.
const WorkflowVisualizer = lazy(() => import('./components/WorkflowViz/WorkflowVisualizer'))
const DocumentsPage = lazy(() => import('./components/Documents/DocumentsPage'))

type Tab = 'chat' | 'workflow' | 'documents'
type WorkflowType = 'chat' | 'upload'

const NAV_ITEMS: { id: Tab; labelKey: string; icon: React.ReactNode }[] = [
  {
    id: 'chat',
    labelKey: 'nav.chat',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: 'workflow',
    labelKey: 'nav.workflow',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      </svg>
    ),
  },
  {
    id: 'documents',
    labelKey: 'nav.documents',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
]

function App() {
  const { locale, setLocale, t } = useLocale()
  const [activeTab, setActiveTab] = useState<Tab>('chat')
  const [isChatProcessing, setIsChatProcessing] = useState(false)
  const [executionId, setExecutionId] = useState<string | null>(null)
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowType>('chat')
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType>('chat')
  const [health, setHealth] = useState<{ qdrant: string; ollama: string; n8n: string } | null>(null)

  const handleChatExecution = (id: string) => {
    setExecutionId(id)
    setActiveWorkflow('chat')
    setSelectedWorkflow('chat')
  }

  const handleUploadExecution = (id: string) => {
    setExecutionId(id)
    setActiveWorkflow('upload')
    setSelectedWorkflow('upload')
  }

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth(null))
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-0)' }}>

      {/* ══════════ Left Navigation Rail ══════════ */}
      <nav className="nav-rail">
        {/* Logo */}
        <div style={{ marginBottom: '4px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--r-md)',
              background: 'rgba(93,107,254,0.12)',
              border: '1px solid rgba(93,107,254,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(93,107,254,0.12)',
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="1.8">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>

        <div className="nav-divider" />

        {/* Nav Buttons */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', width: '100%', alignItems: 'center' }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              title={t(item.labelKey as any) as string}
            >
              {item.icon}
              <span className="tooltip">{t(item.labelKey as any) as string}</span>
            </button>
          ))}
        </div>

        {/* Bottom: Language + Health */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          paddingTop: '10px',
          borderTop: '1px solid var(--b1)',
          width: '100%',
        }}>
          {/* Language switcher */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {(['lv', 'en'] as Locale[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLocale(lang)}
                style={{
                  padding: '6px 10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  borderRadius: 'var(--r-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: locale === lang ? 'var(--accent)' : 'transparent',
                  color: locale === lang ? 'white' : 'var(--t3)',
                  transition: 'all var(--tf) var(--ease)',
                  fontFamily: 'var(--font)',
                  boxShadow: locale === lang ? '0 1px 6px var(--accent-glow)' : 'none',
                }}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Service health indicators */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', alignItems: 'center' }}>
            <HealthPip label="AI" status={health?.ollama} />
            <HealthPip label="DB" status={health?.qdrant} />
            <HealthPip label="n8n" status={health?.n8n} />
          </div>
        </div>
      </nav>

      {/* ══════════ Main Content Area ══════════ */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {activeTab === 'chat' && (
          <ChatPage onProcessingChange={setIsChatProcessing} onExecution={handleChatExecution} />
        )}

        {activeTab === 'workflow' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Workflow header */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--b1)',
              background: 'var(--bg-1)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexShrink: 0,
            }}>
              <div style={{
                width: '40px', height: '40px',
                borderRadius: 'var(--r-sm)',
                background: 'var(--accent-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent-2)',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.01em' }}>
                  {t('wf.title') as string}
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--t3)', marginTop: '1px' }}>
                  {t('wf.description') as string}
                </p>
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Workflow selector */}
                {(['chat', 'upload'] as WorkflowType[]).map(wf => (
                  <button
                    key={wf}
                    onClick={() => setSelectedWorkflow(wf)}
                    style={{
                      fontSize: '13px',
                      padding: '5px 16px',
                      borderRadius: 'var(--r-md)',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font)',
                      fontWeight: 600,
                      transition: 'all 200ms var(--ease)',
                      background: selectedWorkflow === wf ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                      color: selectedWorkflow === wf ? '#fff' : 'var(--t2)',
                      boxShadow: selectedWorkflow === wf ? '0 2px 12px var(--accent-glow)' : 'none',
                    }}
                  >
                    {wf === 'chat' ? 'Chat RAG' : 'Upload Pipeline'}
                  </button>
                ))}

                {isChatProcessing && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 12px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--accent-dim)',
                    border: '1px solid rgba(93,107,254,0.2)',
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-2)' }}>
                      Processing
                    </span>
                    <span className="typing-dots">
                      <span /><span /><span />
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Suspense fallback={
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)' }}>
                <div style={{ width: '24px', height: '24px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            }>
              <WorkflowVisualizer
                isActive={isChatProcessing}
                executionId={executionId}
                workflowType={executionId ? activeWorkflow : selectedWorkflow}
              />
            </Suspense>
          </div>
        )}

        {activeTab === 'documents' && (
          <Suspense fallback={
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)' }}>
              <div style={{ width: '24px', height: '24px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          }>
            <DocumentsPage onExecution={handleUploadExecution} />
          </Suspense>
        )}
      </div>
    </div>
  )
}

/* Compact health pip for the nav rail */
function HealthPip({ label, status }: { label: string; status?: string }) {
  const isOk = status === 'ok'
  const isUnknown = status == null
  const dotClass = isUnknown ? 'dot dot-gray' : isOk ? 'dot dot-green' : 'dot dot-red'

  return (
    <div
      title={`${label}: ${status ?? 'unknown'}`}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'default' }}
    >
      <div className={dotClass} />
      <span style={{ fontSize: '12px', color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
    </div>
  )
}

export default App
