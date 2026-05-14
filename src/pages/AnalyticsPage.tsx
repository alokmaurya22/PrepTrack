import { useMemo, useState } from 'react'
import { Clock, Target, BookOpen, CheckCircle2 } from 'lucide-react'
import { useAllSyllabusNodes, useUserProgress } from '../lib/queries/syllabus'
import { useTasksForWeek } from '../lib/queries/tasks'
import { useTodaySessions, useSessionsForRange } from '../lib/queries/sessions'
import { useTests } from '../lib/queries/tests'
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns'
import { cn } from '../lib/utils'

export function AnalyticsPage() {
  const { data: allNodes } = useAllSyllabusNodes()
  const { data: progressMap } = useUserProgress()
  const { data: todaySessions } = useTodaySessions()

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd   = format(endOfWeek(new Date(),   { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const { data: weekTasks } = useTasksForWeek(weekStart, weekEnd)
  const { data: tests } = useTests()

  // Last 28 days for charts and heatmap
  const [rangeStart] = useState(() => format(subDays(new Date(), 27), 'yyyy-MM-dd'))
  const [rangeEnd]   = useState(() => format(new Date(), 'yyyy-MM-dd') + 'T23:59:59')
  const { data: rangeSessions } = useSessionsForRange(rangeStart, rangeEnd)

  // Syllabus stats
  const syllabusStats = useMemo(() => {
    if (!allNodes || !progressMap) return { total: 0, completed: 0, inProgress: 0, pct: 0 }
    const leaves = allNodes.filter((n) => n.is_leaf)
    const completed  = leaves.filter((n) => progressMap[n.id]?.status === 'completed').length
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
    if (!tests || tests.length === 0) return { total: 0, avgScore: 0 }
    const scores = tests.map((t) => (t.scored_marks / t.total_marks) * 100)
    return {
      total: tests.length,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }
  }, [tests])

  // Build minutes-by-date from all range sessions
  const minutesByDate = useMemo(() => {
    const map: Record<string, number> = {}
    ;(rangeSessions || [])
      .filter((s) => s.session_type === 'focus' && s.duration_minutes)
      .forEach((s) => {
        const date = s.started_at.split('T')[0]
        map[date] = (map[date] || 0) + (s.duration_minutes || 0)
      })
    return map
  }, [rangeSessions])

  // Last 7 days daily focus minutes
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i)
      const dateStr = format(d, 'yyyy-MM-dd')
      return {
        date: dateStr,
        label: format(d, 'EEE'),
        dayNum: format(d, 'd'),
        minutes: minutesByDate[dateStr] || 0,
      }
    })
  }, [minutesByDate])

  // Last 28 days for heatmap
  const last28Days = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => {
      const d = subDays(new Date(), 27 - i)
      const dateStr = format(d, 'yyyy-MM-dd')
      return { date: dateStr, label: format(d, 'MMM d'), minutes: minutesByDate[dateStr] || 0 }
    })
  }, [minutesByDate])

  const heatmapMax = Math.max(...last28Days.map((d) => d.minutes), 60)

  const maxMinutes = Math.max(...last7Days.map((d) => d.minutes), 1)

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
      sub: `${focusStats.sessions} session${focusStats.sessions === 1 ? '' : 's'}`,
      icon: Clock,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Test Avg',
      value: testStats.total > 0 ? `${testStats.avgScore}%` : '—',
      sub: `${testStats.total} test${testStats.total === 1 ? '' : 's'}`,
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
              <div className="text-2xl font-bold text-foreground tabular-nums">{card.value}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Last 7 days focus chart */}
        <div className="border border-border rounded-lg bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Focus Time — Last 7 Days</h3>
          <div className="flex items-end gap-2 h-28">
            {last7Days.map(({ date, label, dayNum, minutes }) => {
              const barH = minutes > 0 ? Math.max(4, Math.round((minutes / maxMinutes) * 88)) : 0
              const isToday = date === format(new Date(), 'yyyy-MM-dd')
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  {minutes > 0 && (
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {minutes >= 60
                        ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
                        : `${minutes}m`}
                    </div>
                  )}
                  <div className="w-full flex items-end justify-center" style={{ height: 88 }}>
                    <div
                      className={cn(
                        'w-full rounded-t-sm transition-all',
                        isToday ? 'bg-primary' : 'bg-primary/40'
                      )}
                      style={{ height: barH }}
                    />
                  </div>
                  <span className={cn('text-[10px] font-medium', isToday ? 'text-primary' : 'text-muted-foreground')}>
                    {label}
                  </span>
                  <span className={cn('text-[10px] tabular-nums', isToday ? 'text-primary' : 'text-muted-foreground/60')}>
                    {dayNum}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground text-right">
            Total this week:{' '}
            <span className="font-semibold text-foreground">
              {(() => {
                const total = last7Days.reduce((s, d) => s + d.minutes, 0)
                return total >= 60
                  ? `${Math.floor(total / 60)}h ${total % 60}m`
                  : `${total}m`
              })()}
            </span>
          </div>
        </div>

        {/* 28-day activity heatmap */}
        <div className="border border-border rounded-lg bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Activity — Last 28 Days</h3>
          <div className="grid grid-cols-7 gap-1">
            {last28Days.map(({ date, label, minutes }) => {
              const intensity = minutes === 0 ? 0 : Math.min(1, minutes / heatmapMax)
              const isToday = date === format(new Date(), 'yyyy-MM-dd')
              return (
                <div
                  key={date}
                  title={`${label}: ${minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`}`}
                  className="aspect-square rounded-sm relative group cursor-default"
                  style={{
                    backgroundColor: minutes === 0
                      ? 'hsl(var(--muted))'
                      : `hsl(var(--primary) / ${Math.max(0.15, intensity)})`,
                    outline: isToday ? '2px solid hsl(var(--primary))' : 'none',
                    outlineOffset: '1px',
                  }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[9px] rounded px-1.5 py-0.5 whitespace-nowrap">
                    {label}: {minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-end gap-2 mt-2">
            <span className="text-[10px] text-muted-foreground">Less</span>
            {[0, 0.25, 0.5, 0.75, 1].map((v) => (
              <div
                key={v}
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: v === 0 ? 'hsl(var(--muted))' : `hsl(var(--primary) / ${v})` }}
              />
            ))}
            <span className="text-[10px] text-muted-foreground">More</span>
          </div>
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
                  <div key={test.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground font-medium truncate block">{test.name}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(test.date), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          'text-sm font-bold tabular-nums w-10 text-right',
                          pct >= 80 ? 'text-emerald-500' : pct >= 60 ? 'text-amber-500' : 'text-red-500'
                        )}
                      >
                        {pct}%
                      </span>
                    </div>
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
