import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadFileAPI as uploadDocument } from '../../api'
import { useLocale } from '../../i18n'

interface UploadZoneProps {
  onUploadComplete: () => void
}

export default function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const { t } = useLocale()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    setUploading(true)
    setError(null)
    setSuccess(false)
    try {
      await uploadDocument(file)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      onUploadComplete()
    } catch (err) {
      setError('Upload failed. Please try again.')
      console.error(err)
    } finally {
      setUploading(false)
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
    disabled: uploading,
  })

  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--b2)'}`,
          borderRadius: 'var(--r-xl)',
          padding: '36px 24px',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          background: isDragActive ? 'var(--accent-dim)' : 'var(--bg-2)',
          transition: 'all 200ms var(--ease)',
          boxShadow: isDragActive ? '0 0 40px rgba(93,107,254,0.12)' : 'none',
        }}
        onMouseEnter={(e) => {
          if (!uploading && !isDragActive) {
            e.currentTarget.style.borderColor = 'var(--b-accent)'
            e.currentTarget.style.background = 'var(--bg-3)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragActive) {
            e.currentTarget.style.borderColor = 'var(--b2)'
            e.currentTarget.style.background = 'var(--bg-2)'
          }
        }}
      >
        <input {...getInputProps()} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {/* Upload icon */}
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: isDragActive ? 'rgba(93,107,254,0.2)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isDragActive ? 'rgba(93,107,254,0.4)' : 'var(--b1)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 200ms',
          }}>
            {uploading ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="2"
                style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            ) : success ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isDragActive ? 'var(--accent-2)' : 'var(--t3)'} strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--t1)', marginBottom: '4px' }}>
              {success ? 'Upload complete!' : uploading ? (t('docs.uploading') as string) : (t('docs.upload_title') as string)}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--t3)' }}>
              {success ? 'Document indexed successfully.' : (t('docs.upload_desc') as string)}
            </p>
          </div>

          {!uploading && !success && (
            <>
              <button
                type="button"
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '13px', marginTop: '4px' }}
              >
                {t('docs.upload_btn') as string}
              </button>
              <p style={{ fontSize: '11px', color: 'var(--t3)', opacity: 0.7, marginTop: '2px' }}>
                {t('docs.formats') as string}
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          marginTop: '12px', padding: '10px 14px',
          borderRadius: 'var(--r-md)',
          background: 'var(--red-dim)',
          border: '1px solid rgba(248,113,113,0.2)',
          color: 'var(--red)',
          fontSize: '13px', textAlign: 'center',
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
