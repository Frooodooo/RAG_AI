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

  const tabs: { id: Tab; labelKey: string; icon: string }[] = [
    { id: 'chat', labelKey: 'nav.chat', icon: '💬' },
    { id: 'workflow', labelKey: 'nav.workflow', icon: '⚙️' },
    { id: 'documents', labelKey: 'nav.documents', icon: '📄' },
  ]

  const [isChatProcessing, setIsChatProcessing] = useState(false)

  return (
    <div className="flex flex-col h-screen">
      {/* ===== Header ===== */}
      <header
        className="flex items-center justify-between px-6 py-3 border-b"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-secondary)' }}
      >
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <RigaLogo size={36} />
          <div>
            <h1
              className="text-base font-bold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              {t('header.title') as string}
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {t('header.subtitle') as string}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="tab-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{t(tab.labelKey as any) as string}</span>
            </button>
          ))}
        </nav>

        {/* Right side: Language toggle + Health */}
        <div className="flex items-center gap-4">
          {/* Language Toggle */}
          <div
            className="flex items-center rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--border-subtle)' }}
          >
            <button
              onClick={() => setLocale('lv' as Locale)}
              className="px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer"
              style={{
                background: locale === 'lv' ? 'var(--accent-primary)' : 'transparent',
                color: locale === 'lv' ? 'white' : 'var(--text-muted)',
                border: 'none',
              }}
            >
              LV
            </button>
            <button
              onClick={() => setLocale('en' as Locale)}
              className="px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer"
              style={{
                background: locale === 'en' ? 'var(--accent-primary)' : 'transparent',
                color: locale === 'en' ? 'white' : 'var(--text-muted)',
                border: 'none',
              }}
            >
              EN
            </button>
          </div>

          {/* Health Status */}
          <div className="flex items-center gap-3">
            <StatusDot label="Ollama" status={health?.ollama} />
            <StatusDot label="Qdrant" status={health?.qdrant} />
            <StatusDot label="n8n" status={health?.n8n} />
          </div>
        </div>
      </header>

      {/* ===== Content ===== */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <ChatPage
            onProcessingChange={setIsChatProcessing}
          />
        )}
        {activeTab === 'workflow' && (
          <WorkflowVisualizer
            isActive={isChatProcessing}
          />
        )}
        {activeTab === 'documents' && <DocumentsPage />}
      </main>
    </div>
  )
}

function StatusDot({ label, status }: { label: string; status?: string }) {
  const isOk = status === 'ok'
  return (
    <div className="flex items-center gap-1.5" title={`${label}: ${status || 'unknown'}`}>
      <div className={`status-dot ${isOk ? 'online' : 'offline'}`} />
      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  )
}

export default App
