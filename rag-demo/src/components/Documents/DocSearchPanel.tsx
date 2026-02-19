import { useState, useRef } from 'react'
import { searchInDocs, type ApiDocument, type SearchResult } from '../../api'

interface DocSearchPanelProps {
  documents: ApiDocument[]
}

export default function DocSearchPanel({ documents }: DocSearchPanelProps) {
  const [query, setQuery] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<string>('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const readyDocs = documents.filter(d => d.status === 'ready')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setSearched(false)
    try {
      const r = await searchInDocs(query.trim(), selectedDoc || undefined, 10)
      setResults(r)
    } catch (err) {
      console.error('Search error:', err)
      setResults([])
    } finally {
      setSearching(false)
      setSearched(true)
    }
  }

  function highlightExcerpt(raw: string) {
    // The doc-server wraps matches in [...]
    return raw.replace(/\[([^\]]+)\]/g, '<mark style="background:rgba(93,107,254,0.2);color:var(--accent-2);border-radius:2px;padding:0 2px">$1</mark>')
  }

  return (
    <div style={{
      background: 'var(--bg-2)', border: '1px solid var(--b1)',
      borderRadius: 'var(--r-xl)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--b1)',
        background: 'rgba(93,107,254,0.04)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}>
          Keyword Search in Documents
        </span>
        <span style={{ fontSize: '11px', color: 'var(--t3)', marginLeft: '4px' }}>
          SQLite FTS5 · exact &amp; proximity matching
        </span>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} style={{ padding: '14px 16px', display: 'flex', gap: '8px' }}>
        {/* Doc filter */}
        <select
          value={selectedDoc}
          onChange={e => setSelectedDoc(e.target.value)}
          style={{
            padding: '7px 10px', borderRadius: 'var(--r-sm)', fontSize: '12px',
            background: 'var(--bg-1)', border: '1px solid var(--b1)',
            color: 'var(--t2)', flexShrink: 0, minWidth: '160px',
            cursor: 'pointer',
          }}
        >
          <option value="">All documents</option>
          {readyDocs.map(d => (
            <option key={d.id} value={d.id}>{d.filename}</option>
          ))}
        </select>

        {/* Query input */}
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder='Search keywords, phrases, or FTS5 expressions like "budget AND 2024"'
          style={{
            flex: 1, padding: '7px 12px', borderRadius: 'var(--r-sm)', fontSize: '13px',
            background: 'var(--bg-1)', border: '1px solid var(--b1)',
            color: 'var(--t1)',
            outline: 'none',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--b1)' }}
        />

        <button
          type="submit"
          disabled={searching || !query.trim() || readyDocs.length === 0}
          className="btn btn-primary"
          style={{ padding: '7px 16px', fontSize: '13px', flexShrink: 0 }}
        >
          {searching ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          ) : 'Search'}
        </button>
      </form>

      {readyDocs.length === 0 && (
        <div style={{
          padding: '16px', textAlign: 'center',
          fontSize: '12px', color: 'var(--t3)',
          borderTop: '1px solid var(--b1)',
        }}>
          No indexed documents yet. Upload and index a document to use keyword search.
        </div>
      )}

      {/* Results */}
      {searched && (
        <div style={{ borderTop: '1px solid var(--b1)' }}>
          {results.length === 0 ? (
            <div style={{
              padding: '24px', textAlign: 'center',
              fontSize: '13px', color: 'var(--t3)',
            }}>
              No matches found for <strong style={{ color: 'var(--t2)' }}>"{query}"</strong>
            </div>
          ) : (
            <div>
              <div style={{
                padding: '8px 16px',
                fontSize: '11px', color: 'var(--t3)',
                background: 'rgba(255,255,255,0.01)',
                borderBottom: '1px solid var(--b1)',
              }}>
                {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
              </div>
              {results.map((r, i) => (
                <div key={i} style={{
                  padding: '12px 16px',
                  borderBottom: i < results.length - 1 ? '1px solid var(--b1)' : 'none',
                  display: 'flex', flexDirection: 'column', gap: '6px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t2)' }}>
                      {r.filename}
                    </span>
                    <span style={{
                      fontSize: '10px', padding: '1px 6px', borderRadius: '999px',
                      background: 'rgba(93,107,254,0.1)', color: 'var(--accent-2)',
                      border: '1px solid rgba(93,107,254,0.2)',
                    }}>
                      score {Math.abs(r.score).toFixed(2)}
                    </span>
                  </div>
                  <p
                    style={{ fontSize: '12px', color: 'var(--t3)', lineHeight: 1.6, margin: 0 }}
                    dangerouslySetInnerHTML={{ __html: highlightExcerpt(r.excerpt) }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
