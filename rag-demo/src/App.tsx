import { useState, useEffect } from 'react'
import { getHealth } from './api'
import { useLocale, type Locale } from './i18n'
import RigaLogo from './components/RigaLogo'
import ChatPage from './components/Chat/ChatPage'
import WorkflowVisualizer from './components/WorkflowViz/WorkflowVisualizer'
import DocumentsPage from './components/Documents/DocumentsPage'

type Tab = 'chat' | 'workflow' | 'documents'

function App() {
  const { locale, setLocale, t } = useLocale()
  const [activeTab, setActiveTab] = useState<Tab>('chat')
  const [isChatProcessing, setIsChatProcessing] = useState(false)
  const [health, setHealth] = useState<{
    qdrant: string
    ollama: string
    n8n: string
  } | null>(null)

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealth(null))
  }, [])

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'chat',
      label: t('nav.chat') as string,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      id: 'workflow',
      label: t('nav.workflow') as string,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
        </svg>
      ),
    },
    {
      id: 'documents',
      label: t('nav.documents') as string,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
  ]

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* ===== Header ===== */}
      <header
        className="flex items-center justify-between shrink-0"
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)',
          padding: '12px 20px',
          minHeight: '64px',
        }}
      >
        {/* Logo & Title */}
        <div className="flex items-center gap-3.5 min-w-0">
          <RigaLogo size={40} />
          <div className="min-w-0">
            <h1
              className="font-bold leading-tight truncate"
              style={{ color: 'var(--text-primary)', fontSize: '16px', letterSpacing: '-0.02em' }}
            >
              {t('header.title') as string}
            </h1>
            <p className="text-xs leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {t('header.subtitle') as string}
            </p>
          </div>
        </div>

        {/* Tab Navigation — centered */}
        <nav className="tab-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Right side: Language + Health */}
        <div className="flex items-center gap-5">
          {/* Language Toggle */}
          <div
            className="flex items-center rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--border-subtle)' }}
          >
            {(['lv', 'en'] as Locale[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLocale(lang)}
                className="px-3.5 py-2 text-xs font-bold transition-all cursor-pointer uppercase tracking-wide"
                style={{
                  background: locale === lang ? 'var(--accent-primary)' : 'transparent',
                  color: locale === lang ? 'white' : 'var(--text-muted)',
                  border: 'none',
                  minWidth: '40px',
                }}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Service Health */}
          <div className="flex items-center gap-4">
            <StatusIndicator label="Ollama" status={health?.ollama} />
            <StatusIndicator label="Qdrant" status={health?.qdrant} />
            <StatusIndicator label="n8n" status={health?.n8n} />
          </div>
        </div>
      </header>

      {/* ===== Content ===== */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <ChatPage onProcessingChange={setIsChatProcessing} />
        )}
        {activeTab === 'workflow' && (
          <WorkflowVisualizer isActive={isChatProcessing} />
        )}
        {activeTab === 'documents' && <DocumentsPage />}
      </main>
    </div>
  )
}

function StatusIndicator({ label, status }: { label: string; status?: string }) {
  const isOk = status === 'ok'
  const isUnknown = status === undefined || status === null

  return (
    <div
      className="flex items-center gap-2"
      title={`${label}: ${status ?? 'unknown'}`}
    >
      <div
        className={`status-dot ${isUnknown ? 'unknown' : isOk ? 'online' : 'offline'}`}
      />
      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  )
}

export default App
