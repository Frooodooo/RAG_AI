import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadFileAPI as uploadDocument } from '../../api'
import { useLocale } from '../../i18n'

interface UploadZoneProps {
  onUploadComplete: () => void
  onExecution?: (executionId: string) => void
}

type UploadStage = 'idle' | 'uploading' | 'processing' | 'done' | 'partial' | 'error'

export default function UploadZone({ onUploadComplete, onExecution }: UploadZoneProps) {
  const { locale } = useLocale()
  const [stage, setStage] = useState<UploadStage>('idle')
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isActive = stage === 'uploading' || stage === 'processing'

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setStage('uploading')
    setErrorMsg(null)
    setProgress({ current: 0, total: acceptedFiles.length })

    let successCount = 0
    let errorCount = 0
    let lastError = ''

    for (let i = 0; i < acceptedFiles.length; i++) {
      setProgress({ current: i + 1, total: acceptedFiles.length })
      try {
        const result = await uploadDocument(acceptedFiles[i])
        if (result.executionId) onExecution?.(result.executionId)
        successCount++
      } catch (err: unknown) {
        errorCount++
        lastError = err instanceof Error ? err.message : 'Unknown error'
        console.error(`[upload] ${acceptedFiles[i].name}:`, err)
      }
    }

    if (errorCount === 0) {
      setStage(acceptedFiles.length > 1 ? 'processing' : 'processing')
      onUploadComplete()
    } else if (successCount > 0) {
      setStage('partial')
      setErrorMsg(`${successCount} uploaded, ${errorCount} failed: ${lastError}`)
      onUploadComplete()
    } else {
      setStage('error')
      setErrorMsg(lastError)
    }

    setTimeout(() => {
      setStage('idle')
      setProgress(null)
      setErrorMsg(null)
    }, 5000)
  }, [onUploadComplete, onExecution])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 20,
    disabled: isActive,
  })

  // ── Labels ──────────────────────────────────────────────────────────────────
  const getTitle = () => {
    if (stage === 'uploading') {
      return progress && progress.total > 1
        ? (locale === 'lv' ? `Augšupielādē ${progress.current}/${progress.total}…` : `Uploading ${progress.current}/${progress.total}…`)
        : (locale === 'lv' ? 'Augšupielādē…' : 'Uploading…')
    }
    if (stage === 'processing') return locale === 'lv' ? 'Indeksē fonā…' : 'Indexing in background…'
    if (stage === 'done') return locale === 'lv' ? 'Augšupielāde pabeigta!' : 'Upload complete!'
    if (stage === 'partial') return locale === 'lv' ? 'Daļēji augšupielādēts' : 'Partially uploaded'
    if (stage === 'error') return locale === 'lv' ? 'Augšupielāde neizdevās' : 'Upload failed'
    return locale === 'lv' ? 'Augšupielādēt dokumentus' : 'Upload Documents'
  }

  const getSub = () => {
    if (stage === 'uploading') return locale === 'lv' ? 'Sūta uz serveri…' : 'Sending to server…'
    if (stage === 'processing') return locale === 'lv' ? 'Teksta izvilkšana + embeddings' : 'Text extraction + embeddings running'
    if (stage === 'done' || stage === 'partial') return locale === 'lv' ? 'Dokumenti parādīsies sarakstā drīz' : 'Documents will appear in the list shortly'
    if (stage === 'error') return locale === 'lv' ? 'Lūdzu, mēģiniet vēlreiz' : 'Please try again'
    return locale === 'lv'
      ? 'Velciet failus šeit vai noklikšķiniet — PDF, DOCX, XLSX'
      : 'Drag files here or click to browse — PDF, DOCX, XLSX'
  }

  // ── Colors ───────────────────────────────────────────────────────────────────
  const isSuccess = stage === 'done' || stage === 'processing'
  const isPartial = stage === 'partial'
  const isError = stage === 'error'

  const borderColor = isDragActive ? 'var(--accent)'
    : isError ? 'rgba(248,113,113,0.5)'
      : isPartial ? 'rgba(251,191,36,0.5)'
        : isSuccess ? 'rgba(52,211,153,0.5)'
          : 'var(--b2)'

  const bgColor = isDragActive ? 'var(--accent-dim)'
    : isError ? 'rgba(248,113,113,0.06)'
      : isPartial ? 'rgba(251,191,36,0.06)'
        : isSuccess ? 'rgba(52,211,153,0.06)'
          : 'var(--bg-2)'

  // ── Icon ─────────────────────────────────────────────────────────────────────
  const renderIcon = () => {
    if (isActive) {
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="2"
          style={{ animation: 'spin 1s linear infinite' }}>
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      )
    }
    if (isSuccess) {
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )
    }
    if (isPartial) {
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgba(251,191,36,0.9)" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )
    }
    if (isError) {
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )
    }
    return (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
        stroke={isDragActive ? 'var(--accent-2)' : 'var(--t3)'} strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    )
  }

  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${borderColor}`,
          borderRadius: 'var(--r-xl)',
          padding: '48px 32px',
          textAlign: 'center',
          cursor: isActive ? 'not-allowed' : 'pointer',
          background: bgColor,
          transition: 'all 200ms var(--ease)',
          boxShadow: isDragActive ? '0 0 40px rgba(93,107,254,0.12)' : 'none',
        }}
        onMouseEnter={(e) => {
          if (!isActive && !isDragActive && stage === 'idle') {
            e.currentTarget.style.borderColor = 'var(--b-accent)'
            e.currentTarget.style.background = 'var(--bg-3)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragActive && stage === 'idle') {
            e.currentTarget.style.borderColor = 'var(--b2)'
            e.currentTarget.style.background = 'var(--bg-2)'
          }
        }}
      >
        <input {...getInputProps()} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {/* Icon */}
          <div style={{
            width: '72px', height: '72px', borderRadius: '18px',
            background: isDragActive ? 'rgba(93,107,254,0.2)'
              : isError ? 'rgba(248,113,113,0.1)'
                : isPartial ? 'rgba(251,191,36,0.1)'
                  : isSuccess ? 'rgba(52,211,153,0.1)'
                    : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isDragActive ? 'rgba(93,107,254,0.4)' : borderColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 200ms',
          }}>
            {renderIcon()}
          </div>

          {/* Text */}
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--t1)', marginBottom: '4px' }}>
              {getTitle()}
            </h3>
            <p style={{ fontSize: '16px', color: 'var(--t3)' }}>
              {getSub()}
            </p>

            {/* Progress bar for multi-file */}
            {isActive && progress && progress.total > 1 && (
              <div style={{ marginTop: '12px', width: '240px', margin: '12px auto 0' }}>
                <div style={{
                  height: '4px', borderRadius: '999px',
                  background: 'rgba(93,107,254,0.15)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(progress.current / progress.total) * 100}%`,
                    background: 'var(--accent)',
                    borderRadius: '999px',
                    transition: 'width 300ms ease',
                  }} />
                </div>
              </div>
            )}

            {/* Processing steps */}
            {stage === 'processing' && (
              <div style={{
                marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '8px',
                fontSize: '13px', color: 'var(--t3)',
              }}>
                {['Extract text', 'Chunk', 'Embed', 'Qdrant'].map((step, i) => (
                  <span key={step} style={{
                    padding: '2px 8px', borderRadius: '999px',
                    background: 'rgba(93,107,254,0.12)', color: 'var(--accent-2)',
                    border: '1px solid rgba(93,107,254,0.2)',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      style={{ animation: `spin ${1 + i * 0.3}s linear infinite` }}>
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    {step}
                  </span>
                ))}
              </div>
            )}
          </div>

          {stage === 'idle' && (
            <>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontSize: '16px', marginTop: '4px' }}
              >
                {locale === 'lv' ? 'Izvēlēties failus' : 'Choose Files'}
              </button>
              <p style={{ fontSize: '14px', color: 'var(--t3)', opacity: 0.7, marginTop: '2px' }}>
                {locale === 'lv' ? 'Līdz 20 faili vienlaikus' : 'Up to 20 files at once'}
              </p>
            </>
          )}
        </div>
      </div>

      {(stage === 'error' || stage === 'partial') && errorMsg && (
        <div style={{
          marginTop: '12px', padding: '10px 14px',
          borderRadius: 'var(--r-md)',
          background: stage === 'partial' ? 'rgba(251,191,36,0.08)' : 'var(--red-dim)',
          border: `1px solid ${stage === 'partial' ? 'rgba(251,191,36,0.3)' : 'rgba(248,113,113,0.2)'}`,
          color: stage === 'partial' ? 'rgba(251,191,36,0.9)' : 'var(--red)',
          fontSize: '14px', textAlign: 'center',
        }}>
          {errorMsg}
        </div>
      )}
    </div>
  )
}
