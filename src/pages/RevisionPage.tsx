import { useState, useEffect } from 'react'
import { CheckCircle, Star, Clock, BookOpen, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'
import { cn } from '../lib/utils'
import { format, addDays, differenceInDays, parseISO, startOfDay } from 'date-fns'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SyllabusNode {
  id: string
  title: string
  code: string | null
  level: number
  paper: string | null
  stage: string | null
}

interface RevisionItem {
  id: string
  user_id: string
  syllabus_node_id: string
  status: 'not_started' | 'in_progress' | 'completed' | 'needs_revision'
  confidence_rating: number | null
  hours_spent: number | null
  next_revision_at: string | null
  completed_at: string | null
  revision_count: number | null
  node: SyllabusNode | null
}

type FilterTab = 'today' | 'week' | 'all'

// ── Helpers ───────────────────────────────────────────────────────────────────

function nextRevisionDays(confidence: number): number {
  if (confidence <= 2) return 1
  if (confidence === 3) return 3
  if (confidence === 4) return 7
  return 14
}

function daysOverdue(nextRevisionAt: string): number {
  const today = startOfDay(new Date())
  const due = startOfDay(parseISO(nextRevisionAt))
  return differenceInDays(today, due)
}

function ConfidenceDots({ rating }: { rating: number | null }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = rating !== null && n <= rating
        const color =
          !filled
            ? 'bg-muted-foreground/20'
            : rating <= 2
            ? 'bg-red-500'
            : rating === 3
            ? 'bg-amber-500'
            : 'bg-emerald-500'
        return (
          <span
            key={n}
            className={cn('inline-block h-2 w-2 rounded-full', color)}
          />
        )
      })}
    </div>
  )
}

function DaysOverdueBadge({ overdue }: { overdue: number }) {
  if (overdue > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <Clock className="h-3 w-3" />
        {overdue}d overdue
      </span>
    )
  }
  if (overdue === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <Clock className="h-3 w-3" />
        Due today
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
      <Clock className="h-3 w-3" />
      In {Math.abs(overdue)}d
    </span>
  )
}

// ── Inline rating panel ───────────────────────────────────────────────────────

interface RatePanelProps {
  item: RevisionItem
  onSave: (itemId: string, confidence: number) => Promise<void>
  onCancel: () => void
}

function RatePanel({ item, onSave, onCancel }: RatePanelProps) {
  const [selected, setSelected] = useState<number>(item.confidence_rating ?? 3)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(item.id, selected)
    setSaving(false)
  }

  return (
    <div className="mt-2 rounded-md border border-border bg-muted/40 p-3">
      <p className="mb-2 text-xs font-medium text-foreground">Rate your confidence</p>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setSelected(n)}
            className={cn(
              'p-1 rounded transition-colors',
              n <= selected ? 'text-amber-500' : 'text-muted-foreground/30 hover:text-amber-400'
            )}
          >
            <Star
              className="h-5 w-5"
              fill={n <= selected ? 'currentColor' : 'none'}
            />
          </button>
        ))}
        <span className="ml-2 text-xs text-muted-foreground">
          Next in {nextRevisionDays(selected)} day{nextRevisionDays(selected) > 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function RevisionPage() {
  const { session } = useAuthStore()
  const userId = session?.user.id

  const [items, setItems] = useState<RevisionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<FilterTab>('today')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // ── Fetch ────────────────────────────────────────────────────────────────

  async function fetchItems(filterTab: FilterTab = tab) {
    if (!userId) return
    setLoading(true)

    const today = new Date()
    let endDate: Date

    if (filterTab === 'today') {
      endDate = today
    } else if (filterTab === 'week') {
      endDate = addDays(today, 7)
    } else {
      // 'all' — everything that is due (past + up to far future; use large range)
      endDate = addDays(today, 365)
    }

    const endDateStr = format(endDate, "yyyy-MM-dd'T'23:59:59")

    const { data, error } = await supabase
      .from('user_syllabus_progress')
      .select('*, node:syllabus_nodes(id, title, code, level, paper, stage)')
      .eq('user_id', userId)
      .lte('next_revision_at', endDateStr)
      .not('next_revision_at', 'is', null)
      .order('next_revision_at')

    if (error) {
      toast.error('Failed to load revision items')
    } else {
      setItems((data as RevisionItem[]) ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (userId) fetchItems(tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, tab])

  // ── Mark revised ─────────────────────────────────────────────────────────

  async function handleMarkRevised(itemId: string, confidence: number) {
    const days = nextRevisionDays(confidence)
    const nextRevision = addDays(new Date(), days)

    const { error } = await supabase
      .from('user_syllabus_progress')
      .update({
        confidence_rating: confidence,
        next_revision_at: nextRevision.toISOString(),
        revision_count: items.find((i) => i.id === itemId)?.revision_count
          ? (items.find((i) => i.id === itemId)!.revision_count! + 1)
          : 1,
        status: 'completed',
      })
      .eq('id', itemId)

    if (error) {
      toast.error('Failed to save revision')
      return
    }

    toast.success(`Revised! Next in ${days} day${days > 1 ? 's' : ''}`)
    setExpandedId(null)
    fetchItems(tab)
  }

  // ── Grouping ─────────────────────────────────────────────────────────────

  type Group = { label: string; items: RevisionItem[] }

  function groupItems(list: RevisionItem[]): Group[] {
    const groups: Record<string, RevisionItem[]> = {}

    for (const item of list) {
      const overdue = daysOverdue(item.next_revision_at!)
      let label: string
      if (overdue > 7) label = `More than 1 week overdue`
      else if (overdue > 0) label = `${overdue} day${overdue > 1 ? 's' : ''} overdue`
      else if (overdue === 0) label = 'Due today'
      else label = `Due in ${Math.abs(overdue)} day${Math.abs(overdue) > 1 ? 's' : ''}`

      if (!groups[label]) groups[label] = []
      groups[label].push(item)
    }

    // Sort groups: overdue first (most overdue first), then today, then upcoming
    return Object.entries(groups)
      .map(([label, items]) => ({ label, items }))
      .sort((a, b) => {
        const overdueA = daysOverdue(a.items[0].next_revision_at!)
        const overdueB = daysOverdue(b.items[0].next_revision_at!)
        return overdueB - overdueA
      })
  }

  const groups = groupItems(items)
  const dueTodayCount = items.filter((i) => daysOverdue(i.next_revision_at!) >= 0).length

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'today', label: 'Due Today' },
    { key: 'week', label: 'Next 7 Days' },
    { key: 'all', label: 'All Due' },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Revision Scheduler</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dueTodayCount} topic{dueTodayCount !== 1 ? 's' : ''} due for review
            </p>
          </div>
          <button
            onClick={() => fetchItems(tab)}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mt-3">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                tab === key
                  ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white'
                  : 'border border-border text-muted-foreground hover:bg-muted'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground animate-pulse text-sm">Loading…</p>
          </div>
        ) : items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <CheckCircle className="h-12 w-12 text-emerald-500" />
            <p className="text-base font-semibold text-foreground">🎉 All caught up!</p>
            <p className="text-sm text-muted-foreground">No revisions due.</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label}>
              {/* Group header — color based on urgency */}
              <p className={cn(
                'text-xs font-semibold uppercase tracking-wide mb-2',
                group.label.toLowerCase().includes('overdue')
                  ? 'text-red-600'
                  : group.label.toLowerCase().includes('today') || group.label === 'Due today'
                  ? 'text-amber-600'
                  : group.label.toLowerCase().includes('due in')
                  ? 'text-emerald-600'
                  : 'text-muted-foreground'
              )}>
                {group.label}
              </p>

              <div className="space-y-2">
                {group.items.map((item) => {
                  const overdue = daysOverdue(item.next_revision_at!)
                  const isExpanded = expandedId === item.id

                  // Left border color based on urgency
                  const borderColor =
                    overdue > 0
                      ? 'border-l-red-500'
                      : overdue === 0
                      ? 'border-l-amber-500'
                      : 'border-l-emerald-500'

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'border border-border rounded-lg bg-card p-4 border-l-4',
                        borderColor
                      )}
                    >
                      {/* Topic row */}
                      <div className="flex items-start gap-3">
                        <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {item.node?.title ?? 'Unknown topic'}
                            </p>
                            {item.node?.code && (
                              <span className="text-xs text-muted-foreground font-mono">
                                {item.node.code}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {item.node?.paper && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                {item.node.paper}
                              </span>
                            )}
                            {item.node?.stage && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                                {item.node.stage}
                              </span>
                            )}
                            <DaysOverdueBadge overdue={overdue} />
                            <ConfidenceDots rating={item.confidence_rating} />
                            {item.revision_count !== null && item.revision_count !== undefined && item.revision_count > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                Rev #{item.revision_count}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Mark as Revised button */}
                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : item.id)
                          }
                          className={cn(
                            'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                            isExpanded
                              ? 'bg-muted border border-border text-muted-foreground'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90'
                          )}
                        >
                          {isExpanded ? 'Cancel' : 'Mark Revised'}
                        </button>
                      </div>

                      {/* Inline rate panel */}
                      {isExpanded && (
                        <RatePanel
                          item={item}
                          onSave={handleMarkRevised}
                          onCancel={() => setExpandedId(null)}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
