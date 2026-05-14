import { useState, useEffect } from 'react'
import { CalendarDays, ChevronDown, ChevronUp, Loader2, LayoutList, Sparkles } from 'lucide-react'
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
  date: string         // yyyy-MM-dd
  dayLabel: string     // e.g. "Mon, 19 May"
  topics: SyllabusLeaf[]
}

type BreakDays = 'none' | 'sundays' | 'weekends'

// ─── Paper ordering ───────────────────────────────────────────────────────────

const PAPER_ORDER: Record<string, number> = {
  GS1: 0,
  GS2: 1,
  GS3: 2,
  GS4: 3,
  Essay: 4,
  Optional: 5,
}

function paperRank(paper: string | null): number {
  if (!paper) return 99
  for (const [key, rank] of Object.entries(PAPER_ORDER)) {
    if (paper.toUpperCase().includes(key.toUpperCase())) return rank
  }
  return 98
}

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

  // Sort topics by paper order, then sort_order
  const sorted = [...topics].sort((a, b) => {
    const pa = paperRank(a.paper)
    const pb = paperRank(b.paper)
    if (pa !== pb) return pa - pb
    return (a.sort_order ?? 9999) - (b.sort_order ?? 9999)
  })

  const isBreakDay = (d: Date): boolean => {
    const dow = getDay(d) // 0 = Sun, 6 = Sat
    if (breakDays === 'sundays') return dow === 0
    if (breakDays === 'weekends') return dow === 0 || dow === 6
    return false
  }

  // Collect available study days
  const studyDays: Date[] = []
  let cur = addDays(today, 0)
  while (cur < exam) {
    if (!isBreakDay(cur)) studyDays.push(new Date(cur))
    cur = addDays(cur, 1)
  }

  if (studyDays.length === 0 || sorted.length === 0) return []

  // Distribute topics across days
  const plan: DayPlan[] = []
  let topicIdx = 0

  for (const day of studyDays) {
    if (topicIdx >= sorted.length) break
    const dayTopics: SyllabusLeaf[] = []
    let hoursUsed = 0

    while (topicIdx < sorted.length) {
      const topic = sorted[topicIdx]
      const hours = topic.default_hours > 0 ? topic.default_hours : 1
      // Add topic if it fits, or if day is still empty (don't skip large topics)
      if (hoursUsed + hours <= hoursPerDay || dayTopics.length === 0) {
        dayTopics.push(topic)
        hoursUsed += hours
        topicIdx++
        // Stop if we've gone over or exactly hit the limit
        if (hoursUsed >= hoursPerDay) break
      } else {
        break
      }
    }

    if (dayTopics.length > 0) {
      plan.push({
        date: format(day, 'yyyy-MM-dd'),
        dayLabel: format(day, 'EEE, d MMM'),
        topics: dayTopics,
      })
    }
  }

  return plan
}

// ─── Week group helper ────────────────────────────────────────────────────────

function groupByWeek(plan: DayPlan[]): { weekLabel: string; days: DayPlan[] }[] {
  const weeks: { weekLabel: string; days: DayPlan[] }[] = []
  let weekStart = 0
  let weekNum = 1

  while (weekStart < plan.length) {
    const slice = plan.slice(weekStart, weekStart + 7)
    weeks.push({
      weekLabel: `Week ${weekNum} — ${slice[0].dayLabel} to ${slice[slice.length - 1].dayLabel}`,
      days: slice,
    })
    weekStart += 7
    weekNum++
  }
  return weeks
}

// ─── Small stat pill ─────────────────────────────────────────────────────────

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border rounded-lg bg-card p-3 text-center min-w-[90px]">
      <p className="text-base font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TimetablePage() {
  const { session } = useAuthStore()

  // Config state
  const [examDate, setExamDate] = useState('')
  const [hoursPerDay, setHoursPerDay] = useState(8)
  const [breakDays, setBreakDays] = useState<BreakDays>('sundays')

  // Data state
  const [pendingTopics, setPendingTopics] = useState<SyllabusLeaf[]>([])
  const [loadingTopics, setLoadingTopics] = useState(true)

  // Plan state
  const [generatedPlan, setGeneratedPlan] = useState<DayPlan[] | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCreatingTasks, setIsCreatingTasks] = useState(false)

  // UI state — which weeks are expanded
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([0]))

  useEffect(() => {
    if (session) fetchPendingTopics()
  }, [session])

  async function fetchPendingTopics() {
    setLoadingTopics(true)
    const userId = session!.user.id

    const [{ data: progressData }, { data: allLeaves }] = await Promise.all([
      supabase
        .from('user_syllabus_progress')
        .select('syllabus_node_id, status')
        .eq('user_id', userId),
      supabase
        .from('syllabus_nodes')
        .select('id, title, code, default_hours, paper, stage, sort_order')
        .eq('user_id', userId)
        .eq('is_leaf', true)
        .order('sort_order'),
    ])

    const completedIds = new Set(
      progressData?.filter((p) => p.status === 'completed').map((p) => p.syllabus_node_id) ?? [],
    )
    // Include not_started, in_progress, and needs_revision — exclude only completed
    const pending = (allLeaves ?? []).filter((n) => !completedIds.has(n.id))
    setPendingTopics(pending)
    setLoadingTopics(false)
  }

  function handleGenerate() {
    if (!examDate) {
      toast.error('Please select an exam date.')
      return
    }
    if (pendingTopics.length === 0) {
      toast.error('No pending topics found.')
      return
    }
    setIsGenerating(true)
    // Small defer so UI can show spinner
    setTimeout(() => {
      const plan = generatePlan(pendingTopics, examDate, hoursPerDay, breakDays)
      setGeneratedPlan(plan)
      setExpandedWeeks(new Set([0]))
      if (plan.length === 0) {
        toast.error('Could not generate a plan. Make sure exam date is in the future.')
      } else {
        toast.success(`Plan generated: ${plan.length} study days`)
      }
      setIsGenerating(false)
    }, 50)
  }

  async function handleCreateTasks() {
    if (!generatedPlan || generatedPlan.length === 0) return
    const userId = session!.user.id
    setIsCreatingTasks(true)

    const tasks = generatedPlan.flatMap((day) =>
      day.topics.map((topic) => ({
        user_id: userId,
        title: topic.title,
        type: 'syllabus',
        target_date: day.date,
        estimated_minutes: (topic.default_hours > 0 ? topic.default_hours : 1) * 60,
        priority: 'p2',
        status: 'pending',
        sort_order: 0,
      })),
    )

    const { error } = await supabase.from('tasks').insert(tasks)
    setIsCreatingTasks(false)

    if (error) {
      toast.error('Failed to create tasks: ' + error.message)
    } else {
      toast.success(`${tasks.length} tasks created in your planner!`)
    }
  }

  // Derived stats
  const totalHours = pendingTopics.reduce(
    (sum, t) => sum + (t.default_hours > 0 ? t.default_hours : 1),
    0,
  )

  const planWeeks = generatedPlan ? groupByWeek(generatedPlan) : []
  const totalTopicsInPlan = generatedPlan?.reduce((s, d) => s + d.topics.length, 0) ?? 0
  const avgTopicsPerDay = generatedPlan && generatedPlan.length > 0
    ? (totalTopicsInPlan / generatedPlan.length).toFixed(1)
    : '0'

  function toggleWeek(idx: number) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
        <CalendarDays className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-lg font-bold text-foreground">Timetable Generator</h1>
          <p className="text-xs text-muted-foreground">Auto-schedule your remaining syllabus</p>
        </div>
      </div>

      {/* Body: two-panel layout */}
      <div className="flex flex-1 overflow-hidden min-h-0 flex-col md:flex-row">

        {/* ── Left: Config ──────────────────────────────────────────────────── */}
        <div className="w-full md:w-72 lg:w-80 flex-shrink-0 border-b md:border-b-0 md:border-r border-border overflow-y-auto p-4 space-y-5">
          <p className="text-sm font-semibold text-foreground">Configure Plan</p>

          {/* Exam Date */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Exam Date *
            </label>
            <input
              type="date"
              value={examDate}
              min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Hours per day */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Study hours per day: <span className="text-foreground font-semibold">{hoursPerDay}h</span>
            </label>
            <input
              type="range"
              min={1}
              max={16}
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
              <span>1h</span>
              <span>16h</span>
            </div>
          </div>

          {/* Break days */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">
              Break days
            </label>
            <div className="space-y-1.5">
              {(
                [
                  { value: 'none', label: 'No breaks — study every day' },
                  { value: 'sundays', label: 'Sundays off' },
                  { value: 'weekends', label: 'Weekends off (Sat + Sun)' },
                ] as const
              ).map(({ value, label }) => (
                <label
                  key={value}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-md border cursor-pointer transition-colors text-sm',
                    breakDays === value
                      ? 'border-primary/60 bg-primary/5 text-foreground'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted',
                  )}
                >
                  <input
                    type="radio"
                    name="breakDays"
                    value={value}
                    checked={breakDays === value}
                    onChange={() => setBreakDays(value)}
                    className="accent-primary"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="border border-border rounded-lg bg-muted/30 p-3 space-y-1">
            {loadingTopics ? (
              <p className="text-xs text-muted-foreground">Loading syllabus data…</p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{pendingTopics.length}</span> topics remaining
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{totalHours}h</span> total hours needed
                </p>
                <p className="text-xs text-muted-foreground">
                  At {hoursPerDay}h/day ≈{' '}
                  <span className="font-semibold text-foreground">
                    {Math.ceil(totalHours / hoursPerDay)} days
                  </span>{' '}
                  of study
                </p>
              </>
            )}
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || loadingTopics || !examDate}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isGenerating ? 'Generating…' : 'Generate Plan'}
          </button>
        </div>

        {/* ── Right: Generated Plan ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4">
          {!generatedPlan ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground gap-3">
              <LayoutList className="h-14 w-14 opacity-20" />
              <p className="text-sm font-medium text-center">
                Configure your plan and click Generate
              </p>
              <p className="text-xs text-center max-w-xs">
                Your remaining syllabus topics will be spread evenly across available study days up to the exam.
              </p>
            </div>
          ) : generatedPlan.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground gap-3">
              <CalendarDays className="h-14 w-14 opacity-20" />
              <p className="text-sm font-medium">No study days available</p>
              <p className="text-xs text-center max-w-xs">
                The exam date may be too soon or all topics are completed. Try choosing a later exam date.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Plan summary row */}
              <div className="flex flex-wrap gap-2">
                <StatPill label="Study Days" value={generatedPlan.length} />
                <StatPill label="Topics" value={totalTopicsInPlan} />
                <StatPill label="Topics/Day" value={avgTopicsPerDay} />
                <StatPill label="Weeks" value={planWeeks.length} />
              </div>

              {/* Create tasks button */}
              <button
                onClick={handleCreateTasks}
                disabled={isCreatingTasks}
                className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isCreatingTasks ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarDays className="h-4 w-4" />
                )}
                {isCreatingTasks ? 'Creating tasks…' : 'Create Tasks in Planner'}
              </button>

              {/* Weeks list */}
              <div className="space-y-2">
                {planWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="border border-border rounded-lg overflow-hidden">
                    {/* Week header */}
                    <button
                      onClick={() => toggleWeek(wIdx)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors"
                    >
                      <span className="text-xs font-semibold text-foreground">{week.weekLabel}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {week.days.reduce((s, d) => s + d.topics.length, 0)} topics
                        </span>
                        {expandedWeeks.has(wIdx) ? (
                          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Day rows */}
                    {expandedWeeks.has(wIdx) && (
                      <div className="divide-y divide-border">
                        {week.days.map((day) => (
                          <div key={day.date} className="px-4 py-2.5 hover:bg-muted/20 transition-colors">
                            <div className="flex items-start gap-3">
                              {/* Date badge */}
                              <div className="flex-shrink-0 text-center min-w-[52px]">
                                <p className="text-xs font-semibold text-primary">{day.dayLabel.split(',')[0]}</p>
                                <p className="text-xs text-muted-foreground">{day.dayLabel.split(',')[1]?.trim()}</p>
                              </div>

                              {/* Topics */}
                              <div className="flex-1 flex flex-wrap gap-1">
                                {day.topics.map((topic, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium max-w-[200px] truncate"
                                    title={topic.title}
                                  >
                                    {topic.title}
                                    <span className="text-primary/60 flex-shrink-0">
                                      {topic.default_hours > 0 ? `${topic.default_hours}h` : '1h'}
                                    </span>
                                  </span>
                                ))}
                              </div>

                              {/* Day total hours */}
                              <div className="flex-shrink-0 text-right">
                                <p className="text-xs font-semibold text-foreground">
                                  {day.topics.reduce(
                                    (s, t) => s + (t.default_hours > 0 ? t.default_hours : 1),
                                    0,
                                  )}
                                  h
                                </p>
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
      </div>
    </div>
  )
}
