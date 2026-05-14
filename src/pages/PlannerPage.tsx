import { useState } from 'react'
import { CalendarDays, CalendarRange, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'
import { DailyView } from '../components/planner/DailyView'
import { WeeklyView } from '../components/planner/WeeklyView'
import { MonthlyView } from '../components/planner/MonthlyView'
import { useDailyLog } from '../lib/queries/dailyLogs'
import { format, isToday, addDays } from 'date-fns'

type ViewMode = 'daily' | 'weekly' | 'monthly'

export function PlannerPage() {
  const [mode, setMode] = useState<ViewMode>('daily')
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date())

  const dateStr = format(selectedDate, 'yyyy-MM-dd')
  const dateLabel = format(selectedDate, 'EEEE, MMMM d, yyyy')
  const todaySelected = isToday(selectedDate)

  const { data: dailyLog } = useDailyLog(dateStr)

  const prevDay = () => setSelectedDate((d) => addDays(d, -1))
  const nextDay = () => setSelectedDate((d) => addDays(d, 1))
  const goToday = () => setSelectedDate(new Date())

  const tabs = [
    { id: 'daily'   as const, label: 'Daily',   icon: CalendarDays  },
    { id: 'weekly'  as const, label: 'Weekly',  icon: CalendarRange },
    { id: 'monthly' as const, label: 'Monthly', icon: Calendar      },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-muted rounded-lg p-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  mode === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date navigation — only in daily mode */}
          {mode === 'daily' && (
            <div className="flex items-center gap-1">
              <button
                onClick={prevDay}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-medium text-foreground tabular-nums w-28 text-center select-none">
                {format(selectedDate, 'MMM d, yyyy')}
              </span>
              <button
                onClick={nextDay}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              {!todaySelected && (
                <button
                  onClick={goToday}
                  className="text-xs text-primary hover:underline px-1"
                >
                  Today
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick stats (daily log for selected date) */}
        {mode === 'daily' && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {dailyLog ? (
              <>
                <span>🎯 {dailyLog.planned_minutes}m planned</span>
                <span>
                  ✅{' '}
                  {dailyLog.completion_pct != null
                    ? Math.round(dailyLog.completion_pct) + '%'
                    : '—'}
                </span>
                {dailyLog.mood && (
                  <span>{['😢', '😐', '🙂', '😊', '🤩'][dailyLog.mood - 1] ?? '—'}</span>
                )}
              </>
            ) : (
              <span className="italic">No log for this day</span>
            )}
          </div>
        )}
      </div>

      {/* View content */}
      <div className="flex-1 overflow-hidden">
        {mode === 'daily' && <DailyView date={dateStr} dateLabel={dateLabel} />}
        {mode === 'weekly' && <WeeklyView />}
        {mode === 'monthly' && <MonthlyView />}
      </div>
    </div>
  )
}
