import { useState, useEffect, useMemo } from 'react'
import {
  CalendarDays, ChevronDown, ChevronUp, Loader2, LayoutList,
  Sparkles, PenLine, X, Plus, Trash2, Settings2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'
import { cn } from '../lib/utils'
import { format, addDays, parseISO, getDay } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SyllabusLeaf {
  id: string
  title: string
  code: string | null
  default_hours: number
  paper: string | null
  stage: string | null
  sort_order: number | null
}

interface DayPlan {
  date: string
  dayLabel: string
  topics: SyllabusLeaf[]
}

type BreakDays = 'none' | 'sundays' | 'weekends'
type GenMode = 'auto' | 'manual'

// ─── Plan generator ───────────────────────────────────────────────────────────

function generatePlan(
  topics: SyllabusLeaf[],
  examDate: string,
  hoursPerDay: number,
  breakDays: BreakDays,
): DayPlan[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exam = parseISO(examDate)
  exam.setHours(0, 0, 0, 0)
  if (exam <= today) return []

  const sorted = [...topics].sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999))

  const isBreakDay = (d: Date): boolean => {
    const dow = getDay(d)
    if (breakDays === 'sundays') return dow === 0
    if (breakDays === 'weekends') return dow === 0 || dow === 6
    return false
  }

  const studyDays: Date[] = []
  let cur = new Date(today)
  while (cur < exam) {
    if (!isBreakDay(cur)) studyDays.push(new Date(cur))
    cur = addDays(cur, 1)
  }

  if (studyDays.length === 0 || sorted.length === 0) return []

  const plan: DayPlan[] = []
  let topicIdx = 0

  for (const day of studyDays) {
    if (topicIdx >= sorted.length) break
    const dayTopics: SyllabusLeaf[] = []
    let hoursUsed = 0
    while (topicIdx < sorted.length) {
      const topic = sorted[topicIdx]
      const hours = topic.default_hours > 0 ? topic.default_hours : 1
      if (hoursUsed + hours <= hoursPerDay || dayTopics.length === 0) {
        dayTopics.push(topic)
        hoursUsed += hours
        topicIdx++
        if (hoursUsed >= hoursPerDay) break
      } else {
        break
      }
    }
    if (dayTopics.length > 0) {
      plan.push({ date: format(day, 'yyyy-MM-dd'), dayLabel: format(day, 'EEE, d MMM'), topics: dayTopics })
    }
  }
  return plan
}

function groupByWeek(plan: DayPlan[]): { weekLabel: string; days: DayPlan[] }[] {
  const weeks: { weekLabel: string; days: DayPlan[] }[] = []
  let i = 0, weekNum = 1
  while (i < plan.length) {
    const slice = plan.slice(i, i + 7)
    weeks.push({ weekLabel: `Week ${weekNum} — ${slice[0].dayLabel} to ${slice[slice.length - 1].dayLabel}`, days: slice })
    i += 7; weekNum++
  }
  return weeks
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border rounded-lg bg-card p-3 text-center min-w-[70px]">
      <p className="text-base font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}

// ─── Config Modal ─────────────────────────────────────────────────────────────

interface ModalProps {
  genMode: GenMode
  setGenMode: (m: GenMode) => void
  examDate: string
  setExamDate: (v: string) => void
  hoursPerDay: number
  setHoursPerDay: (v: number) => void
  breakDays: BreakDays
  setBreakDays: (v: BreakDays) => void
  loadingTopics: boolean
  pendingTopics: SyllabusLeaf[]
  totalHours: number
  isGenerating: boolean
  onGenerate: () => void
  // manual
  manualDate: string
  setManualDate: (v: string) => void
  manualUnassigned: SyllabusLeaf[]
  manualSelected: Set<string>
  toggleManualTopic: (id: string) => void
  onManualAssign: () => void
  onClose: () => void
}

const MODE_OPTIONS: { id: GenMode; label: string; Icon: React.ElementType }[] = [
  { id: 'auto',   label: 'Auto',   Icon: Sparkles },
  { id: 'manual', label: 'Manual', Icon: PenLine  },
]

function ConfigModal({
  genMode, setGenMode,
  examDate, setExamDate,
  hoursPerDay, setHoursPerDay,
  breakDays, setBreakDays,
  loadingTopics, pendingTopics, totalHours,
  isGenerating, onGenerate,
  manualDate, setManualDate,
  manualUnassigned, manualSelected, toggleManualTopic, onManualAssign,
  onClose,
}: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet (bottom on mobile, centered on desktop) */}
      <div className="relative w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh]">

        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Plan Configuration</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {loadingTopics ? 'Loading…' : `${pendingTopics.length} topics · ${totalHours}h total`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="px-5 pt-4 pb-0 flex-shrink-0">
          <div className="flex bg-muted rounded-lg p-0.5">
            {MODE_OPTIONS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setGenMode(id)}
                className={cn('flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                  genMode === id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {genMode === 'auto' ? (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Exam Date *</label>
                <input type="date" value={examDate}
                  min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                  onChange={e => setExamDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Study hours/day: <span className="font-semibold text-foreground">{hoursPerDay}h</span>
                </label>
                <input type="range" min={1} max={16} value={hoursPerDay}
                  onChange={e => setHoursPerDay(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-0.5"><span>1h</span><span>16h</span></div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-2">Break days</label>
                <div className="space-y-2">
                  {([
                    { value: 'none',     label: 'Study every day' },
                    { value: 'sundays',  label: 'Sundays off' },
                    { value: 'weekends', label: 'Weekends off (Sat + Sun)' },
                  ] as const).map(({ value, label }) => (
                    <label key={value} className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-md border cursor-pointer transition-colors text-sm',
                      breakDays === value ? 'border-primary/60 bg-primary/5 text-foreground' : 'border-border bg-background text-muted-foreground hover:bg-muted'
                    )}>
                      <input type="radio" name="breakDays" value={value} checked={breakDays === value}
                        onChange={() => setBreakDays(value)} className="accent-primary" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {!loadingTopics && examDate && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  At {hoursPerDay}h/day ≈ <span className="font-semibold text-foreground">{Math.ceil(totalHours / hoursPerDay)} days</span> needed
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Assign to date</label>
                <input type="date" value={manualDate}
                  onChange={e => setManualDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Select topics
                  {manualSelected.size > 0 && <span className="ml-1 text-primary font-semibold">({manualSelected.size} selected)</span>}
                </label>
                <div className="max-h-60 overflow-y-auto rounded-md border border-border divide-y divide-border/50">
                  {loadingTopics ? (
                    <p className="p-3 text-xs text-muted-foreground text-center">Loading…</p>
                  ) : manualUnassigned.length === 0 ? (
                    <p className="p-3 text-xs text-muted-foreground text-center italic">All topics assigned</p>
                  ) : (
                    manualUnassigned.map(topic => (
                      <label key={topic.id} className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-muted/50 cursor-pointer active:bg-muted">
                        <input type="checkbox" checked={manualSelected.has(topic.id)}
                          onChange={() => toggleManualTopic(topic.id)}
                          className="mt-0.5 accent-primary flex-shrink-0"
                        />
                        <span className="text-xs text-foreground leading-relaxed">{topic.title}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer action */}
        <div className="px-5 py-4 border-t border-border flex-shrink-0">
          {genMode === 'auto' ? (
            <button onClick={onGenerate} disabled={isGenerating || loadingTopics || !examDate}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? 'Generating…' : 'Generate Plan'}
            </button>
          ) : (
            <button onClick={onManualAssign} disabled={manualSelected.size === 0 || !manualDate}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Assign {manualSelected.size > 0 ? `${manualSelected.size} topic${manualSelected.size > 1 ? 's' : ''}` : 'Topics'} to {manualDate ? format(parseISO(manualDate), 'd MMM') : '…'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TimetablePage() {
  const { session } = useAuthStore()

  // Config
  const [genMode, setGenMode] = useState<GenMode>('auto')
  const [examDate, setExamDate] = useState('')
  const [hoursPerDay, setHoursPerDay] = useState(8)
  const [breakDays, setBreakDays] = useState<BreakDays>('sundays')
  const [showModal, setShowModal] = useState(false)

  // Data
  const [pendingTopics, setPendingTopics] = useState<SyllabusLeaf[]>([])
  const [loadingTopics, setLoadingTopics] = useState(true)

  // Plan — editable
  const [plan, setPlan] = useState<DayPlan[] | null>(null)
  const [unassigned, setUnassigned] = useState<SyllabusLeaf[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [addingToDate, setAddingToDate] = useState<string | null>(null)
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([0]))

  // Manual mode
  const [manualDate, setManualDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [manualSelected, setManualSelected] = useState<Set<string>>(new Set())

  useEffect(() => { if (session) fetchPendingTopics() }, [session])

  async function fetchPendingTopics() {
    setLoadingTopics(true)
    const userId = session!.user.id
    const [{ data: progressData }, { data: allLeaves }] = await Promise.all([
      supabase.from('user_syllabus_progress').select('syllabus_node_id, status').eq('user_id', userId),
      supabase.from('syllabus_nodes').select('id, title, code, default_hours, paper, stage, sort_order')
        .eq('user_id', userId).eq('is_leaf', true).order('sort_order'),
    ])
    const completedIds = new Set(
      progressData?.filter(p => p.status === 'completed').map(p => p.syllabus_node_id) ?? []
    )
    setPendingTopics((allLeaves ?? []).filter(n => !completedIds.has(n.id)))
    setLoadingTopics(false)
  }

  // ── Plan editing ─────────────────────────────────────────────────────────────

  function handleRemoveTopic(date: string, topicId: string) {
    const topic = plan?.find(d => d.date === date)?.topics.find(t => t.id === topicId)
    if (!topic) return
    setPlan(prev =>
      prev?.map(d => d.date !== date ? d : { ...d, topics: d.topics.filter(t => t.id !== topicId) })
           .filter(d => d.topics.length > 0) ?? null
    )
    setUnassigned(prev => [...prev, topic])
  }

  function handleAddTopicToDay(date: string, topic: SyllabusLeaf) {
    setPlan(prev => {
      const dayLabel = format(parseISO(date), 'EEE, d MMM')
      if (!prev) return [{ date, dayLabel, topics: [topic] }]
      const exists = prev.find(d => d.date === date)
      if (exists) return prev.map(d => d.date === date ? { ...d, topics: [...d.topics, topic] } : d)
      return [...prev, { date, dayLabel, topics: [topic] }].sort((a, b) => a.date.localeCompare(b.date))
    })
    setUnassigned(prev => prev.filter(t => t.id !== topic.id))
    setAddingToDate(null)
  }

  function handleRemoveDay(date: string) {
    const day = plan?.find(d => d.date === date)
    if (!day) return
    setPlan(prev => prev?.filter(d => d.date !== date) ?? null)
    setUnassigned(prev => [...prev, ...day.topics])
  }

  // ── Auto generate ────────────────────────────────────────────────────────────

  function handleGenerate() {
    if (!examDate) { toast.error('Please select an exam date.'); return }
    if (pendingTopics.length === 0) { toast.error('No pending topics found.'); return }
    setIsGenerating(true)
    setTimeout(() => {
      const generated = generatePlan(pendingTopics, examDate, hoursPerDay, breakDays)
      setPlan(generated)
      setUnassigned([])
      setExpandedWeeks(new Set([0]))
      setIsGenerating(false)
      if (generated.length === 0) {
        toast.error('Could not generate a plan. Check that exam date is in the future.')
      } else {
        toast.success(`Plan generated: ${generated.length} study days`)
        setShowModal(false)
      }
    }, 50)
  }

  // ── Manual assign ────────────────────────────────────────────────────────────

  const manualUnassigned = useMemo(() => {
    const assigned = new Set(plan?.flatMap(d => d.topics.map(t => t.id)) ?? [])
    return pendingTopics.filter(t => !assigned.has(t.id))
  }, [plan, pendingTopics])

  function toggleManualTopic(id: string) {
    setManualSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function handleManualAssign() {
    if (!manualDate || manualSelected.size === 0) return
    const topics = pendingTopics.filter(t => manualSelected.has(t.id))
    topics.forEach(t => handleAddTopicToDay(manualDate, t))
    setManualSelected(new Set())
    toast.success(`${topics.length} topic${topics.length > 1 ? 's' : ''} assigned to ${format(parseISO(manualDate), 'd MMM')}`)
  }

  // ── Save to planner ──────────────────────────────────────────────────────────

  async function handleSaveToPlanner() {
    if (!plan || plan.length === 0) return
    setIsSaving(true)
    const tasks = plan.flatMap(day =>
      day.topics.map(topic => ({
        user_id: session!.user.id,
        title: topic.title,
        type: 'syllabus',
        target_date: day.date,
        estimated_minutes: (topic.default_hours > 0 ? topic.default_hours : 1) * 60,
        priority: 'p2',
        status: 'pending',
        sort_order: 0,
      }))
    )
    const { error } = await supabase.from('tasks').insert(tasks)
    setIsSaving(false)
    if (error) toast.error('Failed to save: ' + error.message)
    else toast.success(`${tasks.length} tasks added to planner!`)
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const totalHours = pendingTopics.reduce((s, t) => s + (t.default_hours > 0 ? t.default_hours : 1), 0)
  const planWeeks = plan ? groupByWeek(plan) : []
  const totalTopicsInPlan = plan?.reduce((s, d) => s + d.topics.length, 0) ?? 0

  function toggleWeek(idx: number) {
    setExpandedWeeks(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n })
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
        <CalendarDays className="h-5 w-5 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground">Timetable</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Build and customize your study schedule</p>
        </div>
        {plan && plan.length > 0 ? (
          <div className="flex items-center gap-2">
            <button onClick={handleSaveToPlanner} disabled={isSaving}
              className="flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-2 text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarDays className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isSaving ? 'Saving…' : 'Add to Planner'}</span>
              <span className="sm:hidden">{isSaving ? '…' : 'Add'}</span>
            </button>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Plan</span>
            </button>
          </div>
        ) : (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate Plan</span>
          </button>
        )}
      </div>

      {/* Body — full width plan view */}
      <div className="flex-1 overflow-y-auto">
        {!plan || plan.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground gap-4 px-6">
            <LayoutList className="h-16 w-16 opacity-15" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">No plan yet</p>
              <p className="text-xs mt-1 opacity-70 max-w-xs">
                Generate an automatic plan or manually assign topics to dates.
              </p>
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors mt-1"
            >
              <Sparkles className="h-4 w-4" /> Generate Plan
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-4">

            {/* Summary row */}
            <div className="flex flex-wrap gap-2 items-center">
              <StatPill label="Days" value={plan.length} />
              <StatPill label="Topics" value={totalTopicsInPlan} />
              <StatPill label="Weeks" value={planWeeks.length} />
              {unassigned.length > 0 && (
                <div className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700/50 text-xs font-medium text-amber-700 dark:text-amber-400">
                  {unassigned.length} unassigned
                </div>
              )}
            </div>

            {/* Unassigned pool */}
            {unassigned.length > 0 && (
              <div className="rounded-lg border border-amber-300 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">
                  Unassigned — click a day's "+" to reassign
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {unassigned.map(t => (
                    <span key={t.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-medium">
                      <span className="truncate max-w-[160px]" title={t.title}>{t.title}</span>
                      <span className="text-amber-600/60">{t.default_hours > 0 ? `${t.default_hours}h` : '1h'}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Plan weeks */}
            <div className="space-y-2">
              {planWeeks.map((week, wIdx) => (
                <div key={wIdx} className="border border-border rounded-lg overflow-hidden">
                  <button onClick={() => toggleWeek(wIdx)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
                  >
                    <span className="text-xs font-semibold text-foreground">{week.weekLabel}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {week.days.reduce((s, d) => s + d.topics.length, 0)} topics
                      </span>
                      {expandedWeeks.has(wIdx)
                        ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                        : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                  </button>

                  {expandedWeeks.has(wIdx) && (
                    <div className="divide-y divide-border">
                      {week.days.map(day => (
                        <div key={day.date} className="px-3 py-2.5 sm:px-4 hover:bg-muted/10 transition-colors">
                          <div className="flex items-start gap-2.5 sm:gap-3">
                            {/* Date badge */}
                            <div className="flex-shrink-0 text-center min-w-[42px] sm:min-w-[46px]">
                              <p className="text-xs font-semibold text-primary">{day.dayLabel.split(',')[0]}</p>
                              <p className="text-[10px] text-muted-foreground leading-tight">{day.dayLabel.split(',')[1]?.trim()}</p>
                            </div>

                            {/* Topics */}
                            <div className="flex-1 flex flex-wrap gap-1.5 min-w-0">
                              {day.topics.map(topic => (
                                <span key={topic.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                                >
                                  <span className="truncate max-w-[140px] sm:max-w-[200px]" title={topic.title}>{topic.title}</span>
                                  <span className="text-primary/50 flex-shrink-0 text-[10px]">
                                    {topic.default_hours > 0 ? `${topic.default_hours}h` : '1h'}
                                  </span>
                                  <button onClick={() => handleRemoveTopic(day.date, topic.id)}
                                    className="ml-0.5 text-primary/40 hover:text-destructive transition-colors flex-shrink-0 p-0.5"
                                    title="Remove from this day"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}

                              {/* Add from unassigned */}
                              {unassigned.length > 0 && (
                                addingToDate === day.date ? (
                                  <div className="flex flex-wrap gap-1 items-center mt-0.5 w-full">
                                    <span className="text-[10px] text-muted-foreground w-full mb-0.5">Pick topic to add:</span>
                                    {unassigned.map(t => (
                                      <button key={t.id} onClick={() => handleAddTopicToDay(day.date, t)}
                                        className="px-2 py-0.5 rounded-full border border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                      >
                                        {t.title.length > 28 ? t.title.slice(0, 28) + '…' : t.title}
                                      </button>
                                    ))}
                                    <button onClick={() => setAddingToDate(null)}
                                      className="text-xs text-muted-foreground hover:text-foreground px-1 ml-1"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button onClick={() => setAddingToDate(day.date)}
                                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full border border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                  >
                                    <Plus className="h-3 w-3" /> Add
                                  </button>
                                )
                              )}
                            </div>

                            {/* Hours + remove day */}
                            <div className="flex-shrink-0 flex items-center gap-1">
                              <span className="text-xs font-semibold text-foreground tabular-nums">
                                {day.topics.reduce((s, t) => s + (t.default_hours > 0 ? t.default_hours : 1), 0)}h
                              </span>
                              <button onClick={() => handleRemoveDay(day.date)}
                                className="p-1 rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title="Remove this day"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Config Modal */}
      {showModal && (
        <ConfigModal
          genMode={genMode} setGenMode={setGenMode}
          examDate={examDate} setExamDate={setExamDate}
          hoursPerDay={hoursPerDay} setHoursPerDay={setHoursPerDay}
          breakDays={breakDays} setBreakDays={setBreakDays}
          loadingTopics={loadingTopics}
          pendingTopics={pendingTopics}
          totalHours={totalHours}
          isGenerating={isGenerating}
          onGenerate={handleGenerate}
          manualDate={manualDate} setManualDate={setManualDate}
          manualUnassigned={manualUnassigned}
          manualSelected={manualSelected}
          toggleManualTopic={toggleManualTopic}
          onManualAssign={handleManualAssign}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
