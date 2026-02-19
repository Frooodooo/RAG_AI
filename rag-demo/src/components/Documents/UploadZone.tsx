import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadFileAPI as uploadDocument } from '../../api'
import { useLocale } from '../../i18n'

interface UploadZoneProps {
  onUploadComplete: () => void
  onExecution?: (executionId: string) => void
}

type UploadStage = 'idle' | 'reading' | 'uploading' | 'processing' | 'done' | 'duplicate' | 'error'

const STAGE_LABELS: Record<UploadStage, { en: string; lv: string }> = {
  idle: { en: 'Upload Document', lv: 'Augšupielādēt dokumentu' },
  reading: { en: 'Reading file…', lv: 'Lasa failu…' },
  uploading: { en: 'Uploading…', lv: 'Augšupielādē…' },
  processing: { en: 'Indexing in background…', lv: 'Indeksē fonā…' },
  done: { en: 'Upload complete!', lv: 'Augšupielāde pabeigta!' },
  duplicate: { en: 'Already indexed', lv: 'Jau indeksēts' },
  error: { en: 'Upload failed', lv: 'Augšupielāde neizdevās' },
}

const STAGE_SUB: Record<UploadStage, { en: string; lv: string }> = {
  idle: { en: 'Drag a file here or click to browse', lv: 'Velciet failu šeit vai noklikšķiniet' },
  reading: { en: 'Converting to base64…', lv: 'Konvertē uz base64…' },
  uploading: { en: 'Sending to n8n…', lv: 'Sūta uz n8n…' },
  processing: { en: 'Text extraction + embeddings running in n8n', lv: 'Teksta izvilkšana + embeddings darbojas n8n' },
  done: { en: 'Document will appear in the list shortly', lv: 'Dokuments parādīsies sarakstā drīz' },
  duplicate: { en: 'This file was already uploaded and indexed', lv: 'Šis fails jau ir augšupielādēts un indeksēts' },
  error: { en: 'Please try again', lv: 'Lūdzu, mēģiniet vēlreiz' },
}

export default function UploadZone({ onUploadComplete, onExecution }: UploadZoneProps) {
  const { t, locale } = useLocale()
  const [stage, setStage] = useState<UploadStage>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isActive = stage === 'reading' || stage === 'uploading' || stage === 'processing'

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setStage('reading')
    setErrorMsg(null)

    try {
      setStage('uploading')
      const result = await uploadDocument(file)

      if (result.duplicate) {
        setStage('duplicate')
      } else {
        setStage('processing')
        if (result.executionId) onExecution?.(result.executionId)
        onUploadComplete()
      }

      // Reset to idle after 4 seconds so user can upload another file
      setTimeout(() => setStage('idle'), 4000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setErrorMsg(msg)
      setStage('error')
      setTimeout(() => setStage('idle'), 5000)
      console.error(err)
    }
  }, [onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    disabled: isActive,
  })

  const stageLabel = STAGE_LABELS[stage][locale as 'en' | 'lv'] ?? STAGE_LABELS[stage].en
  const stageSub = STAGE_SUB[stage][locale as 'en' | 'lv'] ?? STAGE_SUB[stage].en

  const borderColor = isDragActive ? 'var(--accent)'
    : stage === 'error' ? 'rgba(248,113,113,0.5)'
      : stage === 'done' || stage === 'duplicate' ? 'rgba(52,211,153,0.5)'
        : 'var(--b2)'

  const bgColor = isDragActive ? 'var(--accent-dim)'
    : stage === 'error' ? 'rgba(248,113,113,0.06)'
      : stage === 'done' || stage === 'duplicate' ? 'rgba(52,211,153,0.06)'
        : 'var(--bg-2)'

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
              : stage === 'error' ? 'rgba(248,113,113,0.1)'
                : stage === 'done' || stage === 'duplicate' ? 'rgba(52,211,153,0.1)'
                  : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isDragActive ? 'rgba(93,107,254,0.4)' : borderColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 200ms',
          }}>
            {isActive ? (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="2"
                style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            ) : stage === 'done' || stage === 'duplicate' ? (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : stage === 'error' ? (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
                stroke={isDragActive ? 'var(--accent-2)' : 'var(--t3)'} strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            )}
          </div>

          {/* Text */}
          <div>
            <h3 style={{
              fontSize: '20px', fontWeight: 700, color: 'var(--t1)', marginBottom: '4px',
            }}>
              {stageLabel}
            </h3>
            <p style={{ fontSize: '16px', color: 'var(--t3)' }}>
              {stageSub}
            </p>

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
                {t('docs.upload_btn') as string}
              </button>
              <p style={{ fontSize: '14px', color: 'var(--t3)', opacity: 0.7, marginTop: '2px' }}>
                {t('docs.formats') as string}
              </p>
            </>
          )}
        </div>
      </div>

      {stage === 'error' && errorMsg && (
        <div style={{
          marginTop: '12px', padding: '10px 14px',
          borderRadius: 'var(--r-md)',
          background: 'var(--red-dim)',
          border: '1px solid rgba(248,113,113,0.2)',
          color: 'var(--red)',
          fontSize: '16px', textAlign: 'center',
        }}>
          {errorMsg}
        </div>
      )}
    </div>
  )
}
