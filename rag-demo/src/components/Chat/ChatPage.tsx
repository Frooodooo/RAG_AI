import { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { sendChat } from '../../api'
import { useLocale } from '../../i18n'
import ChatInput from './ChatInput'
import ChatMessage from './ChatMessage'
import SourcesPanel from './SourcesPanel'
import RigaLogo from '../RigaLogo'

interface Message {
    role: 'user' | 'ai'
    content: string
    timestamp: Date
    sources?: any[]
}

interface ChatPageProps {
    onProcessingChange?: (isProcessing: boolean) => void
}

export default function ChatPage({ onProcessingChange }: ChatPageProps) {
    const { t } = useLocale()
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(false)
    const [sessionId] = useState(() => uuidv4())
    const bottomRef = useRef<HTMLDivElement>(null)

    // Notify parent about loading state
    useEffect(() => {
        onProcessingChange?.(loading)
    }, [loading, onProcessingChange])

    // Scroll to bottom on new message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    const handleSend = async (text: string) => {
        const userMsg: Message = { role: 'user', content: text, timestamp: new Date() }
        setMessages((prev) => [...prev, userMsg])
        setLoading(true)

        try {
            const response = await sendChat(text, sessionId)
            const aiMsg: Message = {
                role: 'ai',
                content: response.answer,
                timestamp: new Date(),
                sources: response.sources,
            }
            setMessages((prev) => [...prev, aiMsg])
        } catch (error) {
            const errorMsg: Message = {
                role: 'ai',
                content: 'Atvainojiet, radās kļūda savienojumā ar serveri. (Sorry, server connection error.)',
                timestamp: new Date(),
            }
            setMessages((prev) => [...prev, errorMsg])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full relative" style={{ background: 'var(--bg-primary)' }}>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
                <div className="w-full max-w-5xl mx-auto">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center opacity-0 animate-[fade-in-up_0.5s_ease-out_forwards]">
                            <RigaLogo size={64} className="mb-6 opacity-80" />
                            <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                                {t('chat.welcome_title') as string}
                            </h2>
                            <p className="max-w-md text-sm mb-10 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                {t('chat.welcome_desc') as string}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                                {[1, 2, 3, 4].map((i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(t(`chat.starter_${i}` as any) as string)}
                                        className="glass-card px-5 py-4 text-left text-sm transition-all hover:translate-y-[-2px] hover:shadow-lg"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        {t(`chat.starter_${i}` as any) as string} →
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, idx) => (
                                <div key={idx} className="animate-[fade-in-up_0.3s_ease-out_forwards]">
                                    <ChatMessage message={msg} />
                                    {msg.role === 'ai' && msg.sources && msg.sources.length > 0 && (
                                        <SourcesPanel sources={msg.sources} />
                                    )}
                                </div>
                            ))}

                            {loading && (
                                <div className="flex items-center gap-3 mb-6 ml-2 animate-[fade-in-up_0.3s_ease-out_forwards]">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10">
                                        <RigaLogo size={16} />
                                    </div>
                                    <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                                        {t('chat.thinking') as string}<span className="typing-dots"><span></span><span></span><span></span></span>
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <ChatInput onSend={handleSend} disabled={loading} />
        </div>
    )
}
