import { useState } from 'react'
import { CalendarDays, CalendarRange, Calendar } from 'lucide-react'
import { cn } from '../lib/utils'
import { DailyView } from '../components/planner/DailyView'
import { WeeklyView } from '../components/planner/WeeklyView'
import { MonthlyView } from '../components/planner/MonthlyView'
import { useDailyLog } from '../lib/queries/dailyLogs'
import { format } from 'date-fns'

type ViewMode = 'daily' | 'weekly' | 'monthly'

export function PlannerPage() {
  const [mode, setMode] = useState<ViewMode>('daily')
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayLabel = format(new Date(), 'EEEE, MMMM d, yyyy')
  const { data: dailyLog } = useDailyLog(todayStr)

  const tabs = [
    { id: 'daily' as const, label: 'Daily', icon: CalendarDays },
    { id: 'weekly' as const, label: 'Weekly', icon: CalendarRange },
    { id: 'monthly' as const, label: 'Monthly', icon: Calendar },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
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
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {dailyLog && (
            <>
              <span>
                🎯 {dailyLog.planned_minutes}m planned
              </span>
              <span>
                ✅ {dailyLog.completion_pct != null ? Math.round(dailyLog.completion_pct) + '%' : '—'}
              </span>
              {dailyLog.mood && (
                <span>
                  {['😢', '😐', '🙂', '😊', '🤩'][dailyLog.mood - 1] ?? '—'}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* View content */}
      <div className="flex-1 overflow-hidden">
        {mode === 'daily' && <DailyView date={todayStr} dateLabel={todayLabel} />}
        {mode === 'weekly' && <WeeklyView />}
        {mode === 'monthly' && <MonthlyView />}
      </div>
    </div>
  )
}