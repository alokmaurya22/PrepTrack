import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, LayoutDashboard, CalendarDays, Timer, BookOpen, FileText,
  Layers, FolderOpen, ClipboardList, Newspaper, BarChart2,
  Sparkles, Settings, Target, HelpCircle, CalendarCheck2,
  BookMarked, Library, Trophy, TableProperties, RotateCcw,
  ListChecks, X, ArrowRight,
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
  category: string
  keywords?: string
}

const ALL_ITEMS: NavItem[] = [
  { label: 'Dashboard',       to: '/',                icon: LayoutDashboard, category: 'Overview' },
  { label: 'Analytics',       to: '/analytics',       icon: BarChart2,       category: 'Overview' },
  { label: 'Goals',           to: '/goals',           icon: Target,          category: 'Overview' },
  { label: 'Achievements',    to: '/achievements',    icon: Trophy,          category: 'Overview' },
  { label: 'Habits',          to: '/habits',          icon: ListChecks,      category: 'Overview' },
  { label: 'Planner',         to: '/plan',            icon: CalendarDays,    category: 'Plan',    keywords: 'tasks schedule today' },
  { label: 'Timetable',       to: '/timetable',       icon: TableProperties, category: 'Plan' },
  { label: 'Exam Calendar',   to: '/exam-calendar',   icon: CalendarCheck2,  category: 'Plan',    keywords: 'dates upcoming' },
  { label: 'Current Affairs', to: '/current-affairs', icon: Newspaper,       category: 'Plan',    keywords: 'news gk daily' },
  { label: 'Syllabus',        to: '/syllabus',        icon: BookOpen,        category: 'Study',   keywords: 'topics subjects chapters' },
  { label: 'Revision',        to: '/revision',        icon: RotateCcw,       category: 'Study',   keywords: 'review repeat' },
  { label: 'Pomodoro',        to: '/pomodoro',        icon: Timer,           category: 'Study',   keywords: 'focus timer session' },
  { label: 'Notes',           to: '/notes',           icon: FileText,        category: 'Study' },
  { label: 'Flashcards',      to: '/key-notes',       icon: Layers,          category: 'Study',   keywords: 'key notes spaced repetition sm2' },
  { label: 'Quick Ref',       to: '/quick-ref',       icon: BookMarked,      category: 'Study',   keywords: 'reference cheat sheet formulas' },
  { label: 'Reading List',    to: '/reading-list',    icon: Library,         category: 'Study',   keywords: 'books articles newspaper' },
  { label: 'Tests & PYQs',    to: '/tests',           icon: ClipboardList,   category: 'Practice',keywords: 'previous year questions mock test exam pyq' },
  { label: 'Answer Writing',  to: '/mains-answers',   icon: FileText,        category: 'Practice',keywords: 'mains upsc writing' },
  { label: 'Doubt Journal',   to: '/doubts',          icon: HelpCircle,      category: 'Support', keywords: 'questions help problems' },
  { label: 'Resources',       to: '/resources',       icon: FolderOpen,      category: 'Support', keywords: 'books materials pdf links' },
  { label: 'AI Assistant',    to: '/ai',              icon: Sparkles,        category: 'Support', keywords: 'chatgpt ai smart assistant' },
  { label: 'Settings',        to: '/settings',        icon: Settings,        category: 'Settings',keywords: 'profile theme appearance account' },
]

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = query.trim()
    ? ALL_ITEMS.filter((item) => {
        const q = query.toLowerCase()
        return (
          item.label.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.keywords || '').toLowerCase().includes(q)
        )
      })
    : ALL_ITEMS

  const go = useCallback(
    (to: string) => {
      navigate(to)
      onClose()
      setQuery('')
    },
    [navigate, onClose],
  )

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  useEffect(() => {
    setActiveIdx(0)
  }, [query])

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => Math.min(i + 1, filtered.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter' && filtered[activeIdx]) {
        go(filtered[activeIdx].to)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, filtered, activeIdx, go, onClose])

  if (!open) return null

  const grouped = !query.trim()
    ? Object.entries(
        ALL_ITEMS.reduce<Record<string, NavItem[]>>((acc, item) => {
          ;(acc[item.category] = acc[item.category] || []).push(item)
          return acc
        }, {}),
      )
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages and features…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {query ? (
            <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <kbd className="text-[10px] bg-muted border border-border rounded px-1.5 py-0.5 text-muted-foreground flex-shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results for "{query}"
            </p>
          ) : grouped ? (
            grouped.map(([category, items]) => (
              <div key={category}>
                <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                  {category}
                </p>
                {items.map((item) => {
                  const idx = ALL_ITEMS.indexOf(item)
                  const Icon = item.icon
                  return (
                    <button
                      key={item.to}
                      data-idx={idx}
                      onClick={() => go(item.to)}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors',
                        activeIdx === idx
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-muted',
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className="flex-1">{item.label}</span>
                      {activeIdx === idx && <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            ))
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon
              return (
                <button
                  key={item.to}
                  data-idx={idx}
                  onClick={() => go(item.to)}
                  onMouseEnter={() => setActiveIdx(idx)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors',
                    activeIdx === idx
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted',
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{item.category}</span>
                  </div>
                  {activeIdx === idx && <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />}
                </button>
              )
            })
          )}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[10px] text-muted-foreground">
          <span>
            <kbd className="bg-muted border border-border rounded px-1 mr-1">↑↓</kbd>navigate
          </span>
          <span>
            <kbd className="bg-muted border border-border rounded px-1 mr-1">↵</kbd>open
          </span>
          <span>
            <kbd className="bg-muted border border-border rounded px-1 mr-1">esc</kbd>close
          </span>
        </div>
      </div>
    </div>
  )
}
