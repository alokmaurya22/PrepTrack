import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  CheckCircle2, Clock, BookOpen, Flame,
  CalendarDays, Timer, FileText, BarChart2,
  Target, Newspaper, HelpCircle, CalendarCheck2,
  ArrowRight, Circle,
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
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}, {name}!
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
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
            color="text-emerald-500"
            bg="bg-emerald-500/10"
            barColor="bg-emerald-500"
            progress={taskStats.pct}
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
            color="text-red-500"
            bg="bg-red-500/10"
          />
          <StatCard
            label="Study Streak"
            value={`${streak} day${streak === 1 ? '' : 's'}`}
            sub={streak > 0 ? 'Keep it going!' : 'Start a session today'}
            icon={Flame}
            color="text-orange-500"
            bg="bg-orange-500/10"
          />
          <StatCard
            label="Syllabus"
            value={`${syllabusStats.pct}%`}
            sub={`${syllabusStats.completed}/${syllabusStats.total} topics`}
            icon={BookOpen}
            color="text-blue-500"
            bg="bg-blue-500/10"
            barColor="bg-blue-500"
            progress={syllabusStats.pct}
          />
        </div>

        {/* Today's pending tasks */}
        {pendingTasks.length > 0 && (
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
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
          <h2 className="text-sm font-semibold text-foreground mb-2">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickActions.map(({ to, icon: Icon, label, color }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm text-foreground"
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', color)} />
                <span className="truncate">{label}</span>
              </Link>
            ))}
          </div>
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
}: {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  color: string
  bg: string
  barColor?: string
  progress?: number
}) {
  return (
    <div className="border border-border rounded-lg bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('p-1.5 rounded-md', bg)}>
          <Icon className={cn('h-4 w-4', color)} />
        </div>
        <span className="text-xs text-muted-foreground truncate">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
      {progress !== undefined && barColor && (
        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', barColor)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

const quickActions = [
  { to: '/plan',           icon: CalendarDays,   label: 'Planner',        color: 'text-primary'    },
  { to: '/pomodoro',       icon: Timer,          label: 'Pomodoro',       color: 'text-red-500'    },
  { to: '/notes',          icon: FileText,       label: 'Notes',          color: 'text-amber-500'  },
  { to: '/analytics',      icon: BarChart2,      label: 'Analytics',      color: 'text-purple-500' },
  { to: '/goals',          icon: Target,         label: 'Goals',          color: 'text-emerald-500'},
  { to: '/current-affairs',icon: Newspaper,      label: 'Current Affairs',color: 'text-blue-500'   },
  { to: '/doubts',         icon: HelpCircle,     label: 'Doubts',         color: 'text-indigo-500' },
  { to: '/exam-calendar',  icon: CalendarCheck2, label: 'Exam Calendar',  color: 'text-orange-500' },
]
