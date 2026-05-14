import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  CheckCircle2, Clock, BookOpen, Flame,
  CalendarDays, Timer, FileText, BarChart2,
  Target, Newspaper, HelpCircle, CalendarCheck2,
  ArrowRight, Circle, Sparkles, Map,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useTasksForDate } from '../lib/queries/tasks'
import { useAllSyllabusNodes, useUserProgress } from '../lib/queries/syllabus'
import { useTodaySessions, useStudyStreak } from '../lib/queries/sessions'
import { cn } from '../lib/utils'

export function DashboardPage() {
  const { session } = useAuthStore()
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const { data: todayTasks } = useTasksForDate(todayStr)
  const { data: allNodes } = useAllSyllabusNodes()
  const { data: progressMap } = useUserProgress()
  const { data: todaySessions } = useTodaySessions()
  const { data: streak = 0 } = useStudyStreak()

  const taskStats = useMemo(() => {
    if (!todayTasks) return { total: 0, done: 0, pct: 0 }
    const done = todayTasks.filter((t) => t.status === 'completed').length
    const total = todayTasks.length
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
  }, [todayTasks])

  const syllabusStats = useMemo(() => {
    if (!allNodes || !progressMap) return { pct: 0, completed: 0, total: 0 }
    const leaves = allNodes.filter((n) => n.is_leaf)
    const completed = leaves.filter((n) => progressMap[n.id]?.status === 'completed').length
    return {
      pct: leaves.length > 0 ? Math.round((completed / leaves.length) * 100) : 0,
      completed,
      total: leaves.length,
    }
  }, [allNodes, progressMap])

  const focusStats = useMemo(() => {
    const focusSessions = (todaySessions || []).filter(
      (s) => s.session_type === 'focus' && s.duration_minutes
    )
    const minutes = focusSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
    return { sessions: focusSessions.length, minutes }
  }, [todaySessions])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name =
    session?.user?.user_metadata?.display_name ||
    session?.user?.email?.split('@')[0] ||
    'there'

  const pendingTasks = useMemo(
    () => todayTasks?.filter((t) => t.status !== 'completed') ?? [],
    [todayTasks]
  )

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        {/* Greeting hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-violet-600 to-indigo-700 p-6 text-white shadow-lg">
          <div className="relative z-10">
            <p className="text-sm text-white/70 font-medium mb-0.5">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
            <h1 className="text-2xl font-bold">
              {greeting}, {name}! 👋
            </h1>
            {streak > 0 && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-sm font-semibold">
                <Flame className="h-4 w-4 text-orange-300" />
                {streak}-day streak — keep it up!
              </div>
            )}
          </div>
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -right-2 h-24 w-24 rounded-full bg-white/5" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Today's Tasks"
            value={`${taskStats.pct}%`}
            sub={
              taskStats.total === 0
                ? 'No tasks planned'
                : `${taskStats.done}/${taskStats.total} done`
            }
            icon={CheckCircle2}
            color="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
            barColor="bg-gradient-to-r from-emerald-400 to-green-500"
            progress={taskStats.pct}
            accent="border-t-emerald-500"
          />
          <StatCard
            label="Focus Today"
            value={
              focusStats.minutes === 0
                ? '0m'
                : `${Math.floor(focusStats.minutes / 60)}h ${focusStats.minutes % 60}m`
            }
            sub={`${focusStats.sessions} session${focusStats.sessions === 1 ? '' : 's'}`}
            icon={Clock}
            color="text-red-600 dark:text-red-400"
            bg="bg-red-500/10"
            accent="border-t-red-500"
          />
          <StatCard
            label="Study Streak"
            value={`${streak} day${streak === 1 ? '' : 's'}`}
            sub={streak > 0 ? 'Keep it going! 🔥' : 'Start a session today'}
            icon={Flame}
            color="text-orange-600 dark:text-orange-400"
            bg="bg-orange-500/10"
            accent="border-t-orange-500"
          />
          <StatCard
            label="Syllabus"
            value={`${syllabusStats.pct}%`}
            sub={`${syllabusStats.completed}/${syllabusStats.total} topics`}
            icon={BookOpen}
            color="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
            barColor="bg-gradient-to-r from-blue-400 to-indigo-500"
            progress={syllabusStats.pct}
            accent="border-t-blue-500"
          />
        </div>

        {/* Today's pending tasks */}
        {pendingTasks.length > 0 && (
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
              <h2 className="text-sm font-semibold text-foreground">Today's Tasks</h2>
              <Link
                to="/plan"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-border/50">
              {pendingTasks.slice(0, 6).map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Circle
                    className={cn(
                      'h-3.5 w-3.5 flex-shrink-0',
                      task.priority === 'p1'
                        ? 'text-red-500'
                        : task.priority === 'p2'
                        ? 'text-amber-500'
                        : 'text-muted-foreground/50'
                    )}
                  />
                  <span className="text-sm text-foreground flex-1 truncate">{task.title}</span>
                  {task.estimated_minutes ? (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {task.estimated_minutes}m
                    </span>
                  ) : null}
                </div>
              ))}
              {pendingTasks.length > 6 && (
                <div className="px-4 py-2 text-xs text-muted-foreground">
                  +{pendingTasks.length - 6} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state for no tasks */}
        {todayTasks !== undefined && todayTasks.length === 0 && (
          <div className="border border-border rounded-lg bg-card p-6 text-center">
            <CalendarDays className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No tasks planned for today</p>
            <Link
              to="/plan"
              className="inline-block mt-2 text-xs text-primary hover:underline"
            >
              Open Planner to add tasks
            </Link>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickActions.map(({ to, icon: Icon, label, color, bg }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-2.5 p-3 rounded-xl border border-border/50 transition-all text-sm font-medium hover:scale-[1.02] hover:shadow-md active:scale-[0.98]',
                  bg
                )}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', color)} />
                <span className="truncate text-foreground">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Features & Guide links */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/features"
            className="flex-1 flex items-center gap-3 p-4 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors group"
          >
            <div className="p-2 rounded-lg bg-violet-500/10">
              <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Explore Features</p>
              <p className="text-xs text-muted-foreground">See everything PrepTrack can do</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors flex-shrink-0" />
          </Link>
          <Link
            to="/guide"
            className="flex-1 flex items-center gap-3 p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group"
          >
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Map className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">User Guide</p>
              <p className="text-xs text-muted-foreground">Step-by-step guide for all modules</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  bg,
  barColor,
  progress,
  accent,
}: {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  color: string
  bg: string
  barColor?: string
  progress?: number
  accent?: string
}) {
  return (
    <div className={cn('border border-border rounded-xl bg-card p-4 border-t-4', accent ?? 'border-t-border')}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('p-1.5 rounded-lg', bg)}>
          <Icon className={cn('h-4 w-4', color)} />
        </div>
        <span className="text-xs text-muted-foreground truncate">{label}</span>
      </div>
      <div className={cn('text-2xl font-bold tabular-nums', color)}>{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
      {progress !== undefined && barColor && (
        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700', barColor)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

const quickActions = [
  { to: '/plan',           icon: CalendarDays,   label: 'Planner',        color: 'text-violet-600 dark:text-violet-400',  bg: 'bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-900/40'   },
  { to: '/pomodoro',       icon: Timer,          label: 'Pomodoro',       color: 'text-red-600 dark:text-red-400',        bg: 'bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40'             },
  { to: '/notes',          icon: FileText,       label: 'Notes',          color: 'text-amber-600 dark:text-amber-400',    bg: 'bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40'     },
  { to: '/analytics',      icon: BarChart2,      label: 'Analytics',      color: 'text-purple-600 dark:text-purple-400',  bg: 'bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40' },
  { to: '/goals',          icon: Target,         label: 'Goals',          color: 'text-emerald-600 dark:text-emerald-400',bg: 'bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'},
  { to: '/current-affairs',icon: Newspaper,      label: 'Current Affairs',color: 'text-blue-600 dark:text-blue-400',      bg: 'bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40'         },
  { to: '/doubts',         icon: HelpCircle,     label: 'Doubts',         color: 'text-indigo-600 dark:text-indigo-400',  bg: 'bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40' },
  { to: '/exam-calendar',  icon: CalendarCheck2, label: 'Exam Calendar',  color: 'text-orange-600 dark:text-orange-400',  bg: 'bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-900/40' },
]
