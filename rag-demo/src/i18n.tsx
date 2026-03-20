import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

export type Locale = 'lv' | 'en'

// ═══════ Translation dictionaries ═══════
const translations = {
    lv: {
        // Navigation
        'nav.chat': 'Čats',
        'nav.workflow': 'Kā tas darbojas',
        'nav.documents': 'Dokumenti',

        // Header
        'header.title': 'Rīgas pašvaldība',
        'header.subtitle': 'Vietējais AI asistents',

        // Chat
        'chat.welcome_title': 'Jautājiet jebko',
        'chat.welcome_desc': 'Varu atbildēt uz jautājumiem par jūsu augšupielādētajiem dokumentiem latviešu vai angļu valodā',
        'chat.placeholder': 'Uzdodiet jautājumu… (Enter lai nosūtītu)',
        'chat.send': 'Sūtīt',
        'chat.thinking': 'Domāju',
        'chat.powered_by': 'EuroLLM-9B · Darbojas lokāli jūsu datorā',
        'chat.sources_found': (n: number) => `Atrast${n === 1 ? 's' : 'i'} ${n} avot${n === 1 ? 's' : 'i'}`,
        'chat.match': 'atbilstība',
        'chat.starter_1': 'Kādi ir Rīgas pilsētas attīstības plāni?',
        'chat.starter_2': 'Kādi dokumenti ir augšupielādēti?',
        'chat.starter_3': 'Apkopojiet galvenos punktus no pēdējā ziņojuma',
        'chat.starter_4': 'Kādi ir budžeta prioritātes šim gadam?',
        'chat.new_chat': 'Jauna saruna',
        'chat.clear': 'Notīrīt',
        'chat.try_asking': 'Jautājiet',
        'chat.history_saved': 'Vēsture saglabāta lokāli',
        'chat.hint': '· Enter lai nosūtītu · Shift+Enter jaunai rindai · / lai fokusētu',

        // Documents
        'docs.title': 'Dokumentu pārvaldība',
        'docs.description': 'Augšupielādējiet dokumentus, lai izveidotu zināšanu bāzi. Atbalstītie formāti: PDF, DOCX, XLSX',
        'docs.upload_title': 'Augšupielādēt dokumentu',
        'docs.upload_desc': 'Velciet failu šeit vai noklikšķiniet, lai izvēlētos',
        'docs.upload_btn': 'Izvēlēties failu',
        'docs.formats': 'PDF, DOCX, XLSX (maks. 32MB)',
        'docs.uploading': 'Augšupielādē…',
        'docs.col_name': 'Nosaukums',
        'docs.col_type': 'Tips',
        'docs.col_chunks': 'Fragmenti',
        'docs.col_date': 'Datums',
        'docs.col_status': 'Statuss',
        'docs.empty': 'Nav dokumentu. Augšupielādējiet pirmo!',
        'docs.loading': 'Ielādē dokumentus…',
        'docs.search_btn': 'Meklēt',
        'docs.search_placeholder': 'Meklēt dokumentos...',

        // Workflow
        'wf.title': 'Kā darbojas RAG sistēma',
        'wf.description': 'Vizuāla pārskats par dokumentu apstrādes un atbilžu ģenerēšanas plūsmu',
    },
    en: {
        // Navigation
        'nav.chat': 'Chat',
        'nav.workflow': 'How It Works',
        'nav.documents': 'Documents',

        // Header
        'header.title': 'Riga Municipality',
        'header.subtitle': 'Local AI Assistant',

        // Chat
        'chat.welcome_title': 'Ask anything',
        'chat.welcome_desc': 'I can answer questions about your uploaded documents in Latvian or English',
        'chat.placeholder': 'Ask a question… (Enter to send)',
        'chat.send': 'Send',
        'chat.thinking': 'Thinking',
        'chat.powered_by': 'EuroLLM-9B · Running locally on your machine',
        'chat.sources_found': (n: number) => `${n} source${n === 1 ? '' : 's'} found`,
        'chat.match': 'match',
        'chat.starter_1': "What are Riga's city development plans?",
        'chat.starter_2': 'What documents have been uploaded?',
        'chat.starter_3': 'Summarize the main points of the latest report',
        'chat.starter_4': 'What are the budget priorities for this year?',
        'chat.new_chat': 'New Chat',
        'chat.clear': 'Clear',
        'chat.try_asking': 'Try asking',
        'chat.history_saved': 'History saved locally',
        'chat.hint': '· Enter to send · Shift+Enter for newline · / to focus',

        // Documents
        'docs.title': 'Document Management',
        'docs.description': 'Upload documents to build your knowledge base. Supported formats: PDF, DOCX, XLSX',
        'docs.upload_title': 'Upload Document',
        'docs.upload_desc': 'Drag a file here or click to browse',
        'docs.upload_btn': 'Choose a file',
        'docs.formats': 'PDF, DOCX, XLSX (max 32MB)',
        'docs.uploading': 'Uploading…',
        'docs.col_name': 'Name',
        'docs.col_type': 'Type',
        'docs.col_chunks': 'Chunks',
        'docs.col_date': 'Date',
        'docs.col_status': 'Status',
        'docs.empty': 'No documents yet. Upload your first!',
        'docs.loading': 'Loading documents…',
        'docs.search_btn': 'Search',
        'docs.search_placeholder': 'Search documents...',

        // Workflow
        'wf.title': 'How the RAG System Works',
        'wf.description': 'Visual overview of the document processing and answer generation pipeline',
    },
} as const

// ═══════ Types ═══════
type TranslationKey = keyof typeof translations.lv
type TranslationValue = string | ((n: number) => string)

// ═══════ Context ═══════
interface LocaleContextType {
    locale: Locale
    setLocale: (locale: Locale) => void
    t: (key: TranslationKey) => TranslationValue
}

const LocaleContext = createContext<LocaleContextType | null>(null)

// ═══════ Provider ═══════
export function LocaleProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(() => {
        const saved = localStorage.getItem('rag-locale')
        return (saved === 'en' ? 'en' : 'lv') as Locale
    })

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale)
        localStorage.setItem('rag-locale', newLocale)
    }, [])

    const t = useCallback(
        (key: TranslationKey): TranslationValue => {
            return translations[locale][key] ?? translations.lv[key] ?? key
        },
        [locale]
    )

    return (
        <LocaleContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </LocaleContext.Provider>
    )
}

// ═══════ Hook ═══════
export function useLocale() {
    const ctx = useContext(LocaleContext)
    if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
    return ctx
}
