'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { callAIAgent, AIAgentResponse } from '@/lib/aiAgent'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { FiSearch, FiFileText, FiDownload, FiExternalLink, FiClock, FiChevronDown, FiChevronRight, FiRefreshCw, FiCalendar, FiBookOpen, FiMenu, FiX, FiTrash2 } from 'react-icons/fi'

// ─── Constants ────────────────────────────────────────────────────────────────

const AGENT_ID = '699bf6640cb4051b002d36fb'
const HISTORY_KEY = 'admm_digest_history'

const LOADING_MESSAGES = [
  'Searching 25 Australian media outlets...',
  'Scanning ABC, Guardian AU, SMH...',
  'Checking Herald Sun, Daily Telegraph, The Australian...',
  'Scanning 7NEWS, 9News, SBS, news.com.au...',
  'Checking regional outlets and specialist media...',
  'Scanning for NDIS and disability coverage...',
  'Organising articles by theme...',
  'Writing two-sentence summaries...',
  'Preparing your digest...',
]

const MONITORED_OUTLETS = [
  { name: 'ABC', domain: 'abc.net.au' },
  { name: 'Guardian AU', domain: 'theguardian.com' },
  { name: 'SMH', domain: 'smh.com.au' },
  { name: 'The Age', domain: 'theage.com.au' },
  { name: 'AFR', domain: 'afr.com' },
  { name: 'Herald Sun', domain: 'heraldsun.com.au' },
  { name: 'Daily Telegraph', domain: 'dailytelegraph.com.au' },
  { name: 'The Australian', domain: 'theaustralian.com.au' },
  { name: 'SBS', domain: 'sbs.com.au' },
  { name: 'news.com.au', domain: 'news.com.au' },
  { name: '7NEWS', domain: '7news.com.au' },
  { name: '9News', domain: '9news.com.au' },
  { name: 'The Nightly', domain: 'thenightly.com.au' },
  { name: 'The New Daily', domain: 'thenewdaily.com.au' },
  { name: 'The Saturday Paper', domain: 'thesaturdaypaper.com.au' },
  { name: 'Courier-Mail', domain: 'couriermail.com.au' },
  { name: 'The Advertiser', domain: 'adelaidenow.com.au' },
  { name: 'The West Australian', domain: 'thewest.com.au' },
  { name: 'The Mercury', domain: 'themercury.com.au' },
  { name: 'Canberra Times', domain: 'canberratimes.com.au' },
  { name: 'NT News', domain: 'ntnews.com.au' },
  { name: 'The Mandarin', domain: 'themandarin.com.au' },
  { name: 'Croakey', domain: 'croakey.org' },
  { name: 'Redland Bayside News', domain: 'redlandbaysidenews.com.au' },
  { name: 'Newcastle Herald', domain: 'newcastleherald.com.au' },
]

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Article {
  title: string
  summary: string
  publication: string
  author: string
  date: string
  url: string
}

interface Theme {
  theme_name: string
  article_count: number
  articles: Article[]
}

interface DigestData {
  digest_title: string
  digest_date: string
  total_articles: number
  themes: Theme[]
  generation_timestamp: string
}

interface HistoryEntry {
  id: string
  date: string
  total_articles: number
  themes_count: number
  pdf_url?: string
  data: DigestData
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

const SAMPLE_DIGEST: DigestData = {
  digest_title: 'Australian Media Disability Monitor — Daily Digest',
  digest_date: '2026-02-23',
  total_articles: 9,
  themes: [
    {
      theme_name: 'Policy & Funding',
      article_count: 3,
      articles: [
        {
          title: 'NDIS reform bill passes Senate with bipartisan support',
          summary: 'The federal government\'s NDIS reform bill passed the Senate today with bipartisan support. The legislation introduces new independent assessments and aims to improve scheme sustainability.',
          publication: 'ABC News',
          author: 'Jane Smith',
          date: '2026-02-23',
          url: 'https://abc.net.au/news/example-1',
        },
        {
          title: 'States push for increased disability housing funding',
          summary: 'State and territory disability ministers have jointly called for increased federal funding for specialist disability accommodation. The communique follows a two-day meeting in Canberra focused on housing shortages.',
          publication: 'The Australian',
          author: 'Michael Chen',
          date: '2026-02-23',
          url: 'https://theaustralian.com.au/example-2',
        },
        {
          title: 'New NDIS pricing framework takes effect from March',
          summary: 'The NDIA has finalised its updated pricing framework for therapy services, effective 1 March 2026. Providers have expressed mixed reactions, with some welcoming clarity while others flag sustainability concerns.',
          publication: 'The Guardian Australia',
          author: 'Sarah Williams',
          date: '2026-02-22',
          url: 'https://theguardian.com/au/example-3',
        },
      ],
    },
    {
      theme_name: 'Workforce & Employment',
      article_count: 3,
      articles: [
        {
          title: 'Disability employment rate hits record high',
          summary: 'The latest ABS data shows disability employment has reached 53.4 percent, the highest on record. Advocates credit the trend to increased employer awareness and targeted government programs.',
          publication: 'Sydney Morning Herald',
          author: 'David Park',
          date: '2026-02-23',
          url: 'https://smh.com.au/example-4',
        },
        {
          title: 'Support worker shortage worsens in regional areas',
          summary: 'Regional NDIS participants are facing wait times of up to six months for support workers, according to a new report by National Disability Services. The organisation is calling for targeted migration pathways.',
          publication: 'ABC Regional',
          author: 'Emma Brown',
          date: '2026-02-23',
          url: 'https://abc.net.au/news/example-5',
        },
        {
          title: 'Tech company launches inclusive hiring platform',
          summary: 'Australian startup AccessHire has launched a job matching platform specifically designed for people with disability. The platform uses AI to match candidates with accessible workplaces.',
          publication: 'AFR',
          author: 'Tom Liu',
          date: '2026-02-22',
          url: 'https://afr.com/example-6',
        },
      ],
    },
    {
      theme_name: 'Advocacy & Rights',
      article_count: 3,
      articles: [
        {
          title: 'Royal Commission recommendations progress tracker released',
          summary: 'The Disability Royal Commission Implementation Taskforce has released its first quarterly progress tracker. Of the 222 recommendations, 41 have been fully implemented and 98 are in progress.',
          publication: 'SBS News',
          author: 'Priya Sharma',
          date: '2026-02-23',
          url: 'https://sbs.com.au/news/example-7',
        },
        {
          title: 'Advocacy groups welcome new accessible transport standards',
          summary: 'Peak disability advocacy organisations have welcomed updated Disability Standards for Accessible Public Transport. The revised standards mandate real-time audio and visual information on all public transport by 2028.',
          publication: 'The Conversation',
          author: 'Dr Rebecca Jones',
          date: '2026-02-22',
          url: 'https://theconversation.com/example-8',
        },
        {
          title: 'Community campaign pushes for AUSLAN recognition in schools',
          summary: 'A national community campaign is calling for AUSLAN to be offered as a language subject in all Australian schools. The petition has gathered over 50,000 signatures in its first two weeks.',
          publication: 'News.com.au',
          author: 'Karen Walsh',
          date: '2026-02-22',
          url: 'https://news.com.au/example-9',
        },
      ],
    },
  ],
  generation_timestamp: '2026-02-23T10:00:00Z',
}

// ─── Utility Functions ────────────────────────────────────────────────────────

function parseDigestResponse(result: AIAgentResponse): DigestData | null {
  if (!result.success) return null

  let data: any = result?.response?.result

  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      // not valid JSON string
    }
  }

  if (data?.response?.result) {
    data = data.response.result
  }

  if (typeof data === 'string' && result?.response?.message) {
    try {
      data = JSON.parse(result.response.message)
    } catch {
      // not valid JSON
    }
  }

  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      // still a plain string
    }
  }

  if (!data || typeof data !== 'object') return null

  const themes = Array.isArray(data.themes) ? data.themes : []

  return {
    digest_title: data.digest_title || 'Australian Media Disability Monitor — Daily Digest',
    digest_date: data.digest_date || new Date().toISOString().split('T')[0],
    total_articles:
      typeof data.total_articles === 'number'
        ? data.total_articles
        : themes.reduce(
            (sum: number, t: any) =>
              sum + (Array.isArray(t.articles) ? t.articles.length : 0),
            0
          ),
    themes: themes.map((t: any) => ({
      theme_name: t.theme_name || 'Uncategorized',
      article_count:
        typeof t.article_count === 'number'
          ? t.article_count
          : Array.isArray(t.articles)
          ? t.articles.length
          : 0,
      articles: Array.isArray(t.articles)
        ? t.articles.map((a: any) => ({
            title: a.title || 'Untitled',
            summary: a.summary || '',
            publication: a.publication || 'Unknown',
            author: a.author || 'Staff Reporter',
            date: a.date || '',
            url: a.url || '#',
          }))
        : [],
    })),
    generation_timestamp: data.generation_timestamp || new Date().toISOString(),
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveHistory(entries: HistoryEntry[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
  } catch {
    // storage full or unavailable
  }
}

// ─── Markdown Renderer ───────────────────────────────────────────────────────

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return (
            <h4 key={i} className="font-semibold text-sm mt-3 mb-1">
              {line.slice(4)}
            </h4>
          )
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="font-semibold text-base mt-3 mb-1">
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('# '))
          return (
            <h2 key={i} className="font-bold text-lg mt-4 mb-2">
              {line.slice(2)}
            </h2>
          )
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} className="ml-4 list-disc text-sm">
              {formatInline(line.slice(2))}
            </li>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-sm">
              {formatInline(line.replace(/^\d+\.\s/, ''))}
            </li>
          )
        if (!line.trim()) return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm">
            {formatInline(line)}
          </p>
        )
      })}
    </div>
  )
}

// ─── ErrorBoundary ────────────────────────────────────────────────────────────

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: Article }) {
  return (
    <div className="border border-border bg-card p-5 transition-colors hover:bg-secondary/30">
      <h4 className="font-serif text-base font-bold tracking-tight leading-snug text-card-foreground mb-2">
        {article.title}
      </h4>
      {article.summary && (
        <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-3">
          {article.summary}
        </p>
      )}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-muted-foreground tracking-wide">
          <span className="font-medium text-foreground">{article.publication}</span>
          {article.author ? ` \u00B7 ${article.author}` : ''}
          {article.date ? ` \u00B7 ${formatShortDate(article.date)}` : ''}
        </p>
        {article.url && article.url !== '#' && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium tracking-wide uppercase hover:underline"
            style={{ color: 'hsl(0 80% 45%)' }}
          >
            Source <FiExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}

function ThemeSection({
  theme,
  defaultOpen,
}: {
  theme: Theme
  defaultOpen: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const articles = Array.isArray(theme.articles) ? theme.articles : []

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between py-4 group cursor-pointer text-left">
          <div className="flex items-center gap-3">
            {isOpen ? (
              <FiChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <FiChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
            <h3 className="font-serif text-xl font-bold tracking-tight text-foreground">
              {theme.theme_name}
            </h3>
          </div>
          <Badge variant="secondary" className="text-xs font-sans">
            {theme.article_count} {theme.article_count === 1 ? 'article' : 'articles'}
          </Badge>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-3 pb-6 pl-7">
          {articles.map((article, idx) => (
            <ArticleCard key={idx} article={article} />
          ))}
          {articles.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No articles in this theme.</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 py-6">
      <div className="space-y-3">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-56" />
          <div className="space-y-2 pl-7">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
      <div className="w-20 h-20 border-2 border-border flex items-center justify-center mb-6">
        <FiBookOpen className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-serif text-xl font-bold tracking-tight mb-2 text-foreground">
        No digest generated yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-6">
        Click &quot;Generate Today&apos;s Digest&quot; to scan 25 Australian media outlets for NDIS and disability coverage. The system will search each outlet, categorise articles by theme, and produce a comprehensive summary.
      </p>
      <div className="text-left max-w-lg">
        <p className="text-xs text-muted-foreground font-medium tracking-widest uppercase mb-3">
          Monitored Outlets ({MONITORED_OUTLETS.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {MONITORED_OUTLETS.map((outlet) => (
            <span
              key={outlet.domain}
              className="inline-block text-xs px-2 py-1 border border-border bg-card text-muted-foreground"
            >
              {outlet.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function HistorySidebar({
  history,
  onSelectEntry,
  onDeleteEntry,
  selectedId,
  isOpen,
  onClose,
}: {
  history: HistoryEntry[]
  onSelectEntry: (entry: HistoryEntry) => void
  onDeleteEntry: (id: string) => void
  selectedId: string | null
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <>
      {/* Overlay on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-[280px] border-r border-border flex flex-col transition-transform duration-200',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ backgroundColor: 'hsl(0 0% 96%)' }}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold tracking-tight text-foreground">
              Media Monitor
            </h2>
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-secondary"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1 tracking-wide uppercase">
            Disability & NDIS
          </p>
        </div>

        {/* History */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-6 pt-5 pb-2">
            <h3 className="text-xs font-medium text-muted-foreground tracking-widest uppercase">
              History
            </h3>
          </div>
          <ScrollArea className="flex-1 px-3">
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-4 italic">
                No past digests. Generate your first one to see it here.
              </p>
            ) : (
              <div className="space-y-1 pb-4">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      'group flex items-start gap-3 px-3 py-3 cursor-pointer transition-colors',
                      selectedId === entry.id
                        ? 'bg-secondary'
                        : 'hover:bg-secondary/60'
                    )}
                    onClick={() => onSelectEntry(entry)}
                  >
                    <FiClock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {formatShortDate(entry.date)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.total_articles} articles / {entry.themes_count} themes
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {entry.pdf_url && (
                        <a
                          href={entry.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 hover:bg-muted"
                          title="Download PDF"
                        >
                          <FiDownload className="w-3.5 h-3.5 text-muted-foreground" />
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteEntry(entry.id)
                        }}
                        className="p-1 hover:bg-muted"
                        title="Remove from history"
                      >
                        <FiTrash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Agent Info */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground tracking-wide uppercase mb-2 font-medium">
            Powered by
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 flex-shrink-0" />
              <span className="text-xs text-foreground truncate">
                Digest Coordinator Manager
              </span>
            </div>
            <p className="text-xs text-muted-foreground pl-4 leading-relaxed">
              Searches 25 Australian outlets, organises by theme, and generates PDF.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Page() {
  const [digestData, setDigestData] = useState<DigestData | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSampleData, setShowSampleData] = useState(false)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [currentDate, setCurrentDate] = useState('')
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load history from localStorage on mount
  useEffect(() => {
    setHistory(loadHistory())
    setCurrentDate(new Date().toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }))
  }, [])

  // Loading message cycling
  useEffect(() => {
    if (loading) {
      setLoadingMsgIdx(0)
      loadingIntervalRef.current = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length)
      }, 3000)
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current)
        loadingIntervalRef.current = null
      }
    }
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current)
      }
    }
  }, [loading])

  const handleGenerate = useCallback(async () => {
    setLoading(true)
    setError(null)
    setDigestData(null)
    setPdfUrl(null)
    setSelectedHistoryId(null)
    setShowSampleData(false)

    try {
      const result = await callAIAgent(
        "Generate today's Australian Media Disability Monitor digest for the past 24 hours. Search ALL of the following 25 Australian media outlets for articles mentioning NDIS, National Disability Insurance Scheme, or disability: ABC (abc.net.au), Guardian Australia (theguardian.com), Sydney Morning Herald (smh.com.au), The Age (theage.com.au), AFR (afr.com), Herald Sun (heraldsun.com.au), Daily Telegraph (dailytelegraph.com.au), The Australian (theaustralian.com.au), SBS (sbs.com.au), news.com.au, 7NEWS (7news.com.au), 9News (9news.com.au), The Nightly (thenightly.com.au), The New Daily (thenewdaily.com.au), The Saturday Paper (thesaturdaypaper.com.au), Courier-Mail (couriermail.com.au), The Advertiser (adelaidenow.com.au), The West Australian (thewest.com.au), The Mercury (themercury.com.au), Canberra Times (canberratimes.com.au), NT News (ntnews.com.au), The Mandarin (themandarin.com.au), Croakey (croakey.org), Redland Bayside News (redlandbaysidenews.com.au), Newcastle Herald (newcastleherald.com.au). Collect complete article details including title, URL, publication, author, date, and content summary. Then categorize all found articles into themes and write two-sentence summaries for each.",
        AGENT_ID
      )

      const parsed = parseDigestResponse(result)

      if (parsed) {
        setDigestData(parsed)

        // Extract PDF URL from module_outputs (top level)
        const files = result?.module_outputs?.artifact_files
        let extractedPdfUrl: string | undefined
        if (Array.isArray(files) && files.length > 0) {
          extractedPdfUrl = files[0]?.file_url
          if (extractedPdfUrl) {
            setPdfUrl(extractedPdfUrl)
          }
        }

        // Save to history
        const newEntry: HistoryEntry = {
          id: `digest-${Date.now()}`,
          date: parsed.digest_date,
          total_articles: parsed.total_articles,
          themes_count: Array.isArray(parsed.themes) ? parsed.themes.length : 0,
          pdf_url: extractedPdfUrl,
          data: parsed,
        }
        const updatedHistory = [newEntry, ...history].slice(0, 20)
        setHistory(updatedHistory)
        saveHistory(updatedHistory)
        setSelectedHistoryId(newEntry.id)
      } else {
        setError(
          result?.error ||
            result?.response?.message ||
            'Failed to parse the digest response. The agent may have returned an unexpected format. Please try again.'
        )
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while generating the digest.'
      )
    } finally {
      setLoading(false)
    }
  }, [history])

  const handleSelectHistory = useCallback((entry: HistoryEntry) => {
    setDigestData(entry.data)
    setPdfUrl(entry.pdf_url || null)
    setSelectedHistoryId(entry.id)
    setError(null)
    setShowSampleData(false)
    setSidebarOpen(false)
  }, [])

  const handleDeleteHistory = useCallback(
    (id: string) => {
      const updated = history.filter((h) => h.id !== id)
      setHistory(updated)
      saveHistory(updated)
      if (selectedHistoryId === id) {
        setDigestData(null)
        setPdfUrl(null)
        setSelectedHistoryId(null)
      }
    },
    [history, selectedHistoryId]
  )

  const handleToggleSampleData = useCallback(
    (checked: boolean) => {
      setShowSampleData(checked)
      if (checked) {
        setDigestData(SAMPLE_DIGEST)
        setPdfUrl(null)
        setError(null)
        setSelectedHistoryId(null)
      } else {
        setDigestData(null)
        setPdfUrl(null)
      }
    },
    []
  )

  const displayData = digestData
  const themes = Array.isArray(displayData?.themes) ? displayData.themes : []

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Sidebar */}
        <HistorySidebar
          history={history}
          onSelectEntry={handleSelectHistory}
          onDeleteEntry={handleDeleteHistory}
          selectedId={selectedHistoryId}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-screen">
          {/* Top Bar */}
          <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-secondary"
              >
                <FiMenu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight">
                  Australian Media Disability Monitor
                </h1>
                <p className="text-xs text-muted-foreground tracking-wide mt-0.5">
                  Daily Intelligence Digest{currentDate ? ` \u2014 ${currentDate}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground font-medium tracking-wide cursor-pointer select-none">
                Sample Data
              </label>
              <Switch
                checked={showSampleData}
                onCheckedChange={handleToggleSampleData}
                disabled={loading}
              />
            </div>
          </header>

          {/* Control Bar */}
          <div className="border-b border-border bg-card px-6 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <FiCalendar className="w-4 h-4" />
                <span className="font-medium">Coverage: Past 24 hours across 25 outlets</span>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans text-sm font-medium tracking-wide px-6 py-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FiSearch className="w-4 h-4" />
                    Generate Today&apos;s Digest
                  </span>
                )}
              </Button>
            </div>

            {/* Loading status message */}
            {loading && (
              <div className="mt-3 flex items-center gap-2">
                <div className="w-2 h-2 animate-pulse" style={{ backgroundColor: 'hsl(0 80% 45%)' }} />
                <p className="text-sm text-muted-foreground animate-pulse">
                  {LOADING_MESSAGES[loadingMsgIdx]}
                </p>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-8">
              {/* Error State */}
              {error && !loading && (
                <div className="border border-border bg-card p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 border border-border" style={{ color: 'hsl(0 80% 45%)' }}>
                      <FiFileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-base font-bold tracking-tight mb-1 text-foreground">
                        Generation Failed
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        {error}
                      </p>
                      <Button
                        onClick={handleGenerate}
                        variant="outline"
                        className="text-sm"
                      >
                        <FiRefreshCw className="w-3.5 h-3.5 mr-2" />
                        Retry
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading && <LoadingSkeleton />}

              {/* Empty State */}
              {!loading && !displayData && !error && <EmptyState />}

              {/* Digest Content */}
              {!loading && displayData && (
                <div>
                  {/* Digest Header */}
                  <div className="mb-8">
                    <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">
                      {displayData.digest_title}
                    </h2>
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(displayData.digest_date)}
                      </span>
                      <Separator orientation="vertical" className="h-4" />
                      <Badge variant="secondary" className="text-xs font-sans">
                        {displayData.total_articles} total articles
                      </Badge>
                      <Separator orientation="vertical" className="h-4" />
                      <Badge variant="outline" className="text-xs font-sans">
                        {themes.length} {themes.length === 1 ? 'theme' : 'themes'}
                      </Badge>
                    </div>
                    {displayData.generation_timestamp && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Generated: {formatShortDate(displayData.generation_timestamp)}
                      </p>
                    )}
                  </div>

                  <Separator className="mb-6" />

                  {/* Themes */}
                  {themes.length > 0 ? (
                    <div className="divide-y divide-border">
                      {themes.map((theme, idx) => (
                        <ThemeSection
                          key={idx}
                          theme={theme}
                          defaultOpen={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground italic">
                        No themes were identified in this digest.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Download Bar (sticky bottom) */}
          {!loading && displayData && (
            <div className="border-t border-border bg-card px-6 py-4 sticky bottom-0 z-20">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FiFileText className="w-4 h-4" />
                  <span>
                    {displayData.total_articles} articles across{' '}
                    {themes.length} themes
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {pdfUrl ? (
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans text-sm font-medium">
                        <FiDownload className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    </a>
                  ) : (
                    <Button
                      disabled
                      variant="outline"
                      className="text-sm font-sans"
                    >
                      <FiDownload className="w-4 h-4 mr-2" />
                      {showSampleData ? 'PDF not available (sample data)' : 'PDF not available'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ErrorBoundary>
  )
}
