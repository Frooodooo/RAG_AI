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

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        setUploading(true)
        setError(null)

        try {
            await uploadDocument(file)
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
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        },
        maxFiles: 1
    })

    return (
        <section className="glass-card p-6 rounded-xl hover:bg-white/5 transition-colors">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-teal-500 bg-teal-500/10' : 'border-white/10 hover:border-white/20'}`}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" color="var(--accent-primary)">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>

                    <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                        {t('docs.upload_title') as string}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {t('docs.upload_desc') as string}
                    </p>
                    <div className="mt-4">
                        <button className="btn-primary">
                            {uploading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    {t('docs.uploading') as string}
                                </span>
                            ) : (
                                t('docs.upload_btn') as string
                            )}
                        </button>
                    </div>
                    <p className="text-xs mt-2 opacity-60" style={{ color: 'var(--text-muted)' }}>
                        {t('docs.formats') as string}
                    </p>
                </div>
            </div>
            {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                    {error}
                </div>
            )}
        </section>
    )
}
