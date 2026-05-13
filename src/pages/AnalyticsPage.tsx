import { useMemo } from 'react'
import { Clock, Target, BookOpen, CheckCircle2 } from 'lucide-react'
import { useAllSyllabusNodes, useUserProgress } from '../lib/queries/syllabus'
import { useTasksForWeek } from '../lib/queries/tasks'
import { useTodaySessions } from '../lib/queries/sessions'
import { useTests } from '../lib/queries/tests'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { cn } from '../lib/utils'

export function AnalyticsPage() {
  const { data: allNodes } = useAllSyllabusNodes()
  const { data: progressMap } = useUserProgress()
  const { data: todaySessions } = useTodaySessions()

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const { data: weekTasks } = useTasksForWeek(weekStart, weekEnd)
  const { data: tests } = useTests()

  // Syllabus stats
  const syllabusStats = useMemo(() => {
    if (!allNodes || !progressMap) return { total: 0, completed: 0, inProgress: 0, pct: 0 }
    const leaves = allNodes.filter((n) => n.is_leaf)
    const completed = leaves.filter((n) => progressMap[n.id]?.status === 'completed').length
    const inProgress = leaves.filter((n) => progressMap[n.id]?.status === 'in_progress').length
    return {
      total: leaves.length,
      completed,
      inProgress,
      pct: leaves.length > 0 ? Math.round((completed / leaves.length) * 100) : 0,
    }
  }, [allNodes, progressMap])

  // Weekly task stats
  const taskStats = useMemo(() => {
    if (!weekTasks) return { total: 0, completed: 0, pct: 0 }
    const completed = weekTasks.filter((t) => t.status === 'completed').length
    return {
      total: weekTasks.length,
      completed,
      pct: weekTasks.length > 0 ? Math.round((completed / weekTasks.length) * 100) : 0,
    }
  }, [weekTasks])

  // Focus time today
  const focusStats = useMemo(() => {
    if (!todaySessions) return { sessions: 0, minutes: 0 }
    const focusSessions = todaySessions.filter((s) => s.session_type === 'focus' && s.duration_minutes)
    return {
      sessions: focusSessions.length,
      minutes: focusSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
    }
  }, [todaySessions])

  // Test stats
  const testStats = useMemo(() => {
    if (!tests || tests.length === 0) return { total: 0, avgScore: 0, latest: null }
    const scores = tests.map((t) => (t.scored_marks / t.total_marks) * 100)
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    return {
      total: tests.length,
      avgScore: Math.round(avg),
      latest: tests[0],
    }
  }, [tests])

  const statCards = [
    {
      label: 'Syllabus',
      value: `${syllabusStats.pct}%`,
      sub: `${syllabusStats.completed}/${syllabusStats.total} topics`,
      icon: BookOpen,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Weekly Tasks',
      value: `${taskStats.pct}%`,
      sub: `${taskStats.completed}/${taskStats.total} done`,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Focus Today',
      value: `${Math.floor(focusStats.minutes / 60)}h ${focusStats.minutes % 60}m`,
      sub: `${focusStats.sessions} sessions`,
      icon: Clock,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Test Avg',
      value: testStats.total > 0 ? `${testStats.avgScore}%` : '—',
      sub: `${testStats.total} tests`,
      icon: Target,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
  ]

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your study performance at a glance</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((card) => (
            <div key={card.label} className="border border-border rounded-lg bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('p-1.5 rounded-md', card.bg)}>
                  <card.icon className={cn('h-4 w-4', card.color)} />
                </div>
                <span className="text-xs text-muted-foreground">{card.label}</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{card.value}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Syllabus progress bar */}
        <div className="border border-border rounded-lg bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Syllabus Completion</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${syllabusStats.pct}%` }}
              />
            </div>
            <span className="text-sm font-bold text-foreground tabular-nums">{syllabusStats.pct}%</span>
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{syllabusStats.completed} completed</span>
            <span>{syllabusStats.inProgress} in progress</span>
            <span>{syllabusStats.total - syllabusStats.completed - syllabusStats.inProgress} remaining</span>
          </div>
        </div>

        {/* Weekly task completion */}
        <div className="border border-border rounded-lg bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">This Week's Tasks</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${taskStats.pct}%` }}
              />
            </div>
            <span className="text-sm font-bold text-foreground tabular-nums">{taskStats.pct}%</span>
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{taskStats.completed} done</span>
            <span>{taskStats.total - taskStats.completed} pending</span>
          </div>
        </div>

        {/* Recent tests */}
        {tests && tests.length > 0 && (
          <div className="border border-border rounded-lg bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Recent Tests</h3>
            <div className="space-y-2">
              {tests.slice(0, 5).map((test) => {
                const pct = Math.round((test.scored_marks / test.total_marks) * 100)
                return (
                  <div key={test.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-medium">{test.name}</span>
                      <span className="text-muted-foreground">{format(new Date(test.date), 'MMM d')}</span>
                    </div>
                    <span className={cn(
                      'font-semibold tabular-nums',
                      pct >= 80 ? 'text-emerald-500' : pct >= 60 ? 'text-amber-500' : 'text-red-500'
                    )}>
                      {pct}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}