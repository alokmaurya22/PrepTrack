import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format, startOfYear, endOfYear, eachMonthOfInterval,
  startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday,
} from 'date-fns'
import { useTasksForDateRange, type Task } from '../../lib/queries/tasks'
import { cn } from '../../lib/utils'

interface Props {
  onSelectDate?: (date: string) => void
}

const MINI_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function dayColor(tasks: Task[]): string | null {
  if (tasks.length === 0) return null
  const done = tasks.filter(t => t.status === 'completed').length
  if (done === tasks.length) return 'bg-green-500 dark:bg-green-600 text-white'
  if (done > 0) return 'bg-amber-400 dark:bg-amber-500 text-white'
  return 'bg-primary text-primary-foreground'
}

export function YearlyView({ onSelectDate }: Props) {
  const [year, setYear] = useState(new Date().getFullYear())

  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  const { data: tasks, isLoading } = useTasksForDateRange(startDate, endDate)

  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {}
    tasks?.forEach(task => {
      if (task.target_date) {
        if (!map[task.target_date]) map[task.target_date] = []
        map[task.target_date].push(task)
      }
    })
    return map
  }, [tasks])

  const months = eachMonthOfInterval({
    start: startOfYear(new Date(year, 0)),
    end: endOfYear(new Date(year, 0)),
  })

  return (
    <div className="h-full overflow-y-auto">
      {/* Year nav */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border sticky top-0 bg-background z-10">
        <button onClick={() => setYear(y => y - 1)} className="p-1 rounded hover:bg-muted">
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-semibold text-foreground w-12 text-center tabular-nums">{year}</span>
        <button onClick={() => setYear(y => y + 1)} className="p-1 rounded hover:bg-muted">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <button onClick={() => setYear(new Date().getFullYear())} className="text-xs text-primary hover:underline px-2">
          This year
        </button>
        <div className="ml-auto flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary" /> Pending</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-400" /> Partial</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-500" /> Done</span>
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-sm text-muted-foreground animate-pulse">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
          {months.map(monthDate => {
            const monthStart = startOfMonth(monthDate)
            const monthEnd = endOfMonth(monthDate)
            const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
            const startDow = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1

            const monthTasks = days.reduce((s, d) => s + (tasksByDay[format(d, 'yyyy-MM-dd')]?.length ?? 0), 0)

            return (
              <div key={format(monthDate, 'yyyy-MM')} className="border border-border rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-muted/30 border-b border-border flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{format(monthDate, 'MMMM')}</span>
                  {monthTasks > 0 && (
                    <span className="text-[10px] text-muted-foreground">{monthTasks} tasks</span>
                  )}
                </div>
                <div className="p-2">
                  {/* Day headers */}
                  <div className="grid grid-cols-7 mb-1">
                    {MINI_HEADERS.map((h, i) => (
                      <div key={i} className="text-center text-[9px] font-medium text-muted-foreground py-0.5">{h}</div>
                    ))}
                  </div>
                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-px">
                    {Array.from({ length: startDow }).map((_, i) => (
                      <div key={`e-${i}`} />
                    ))}
                    {days.map(day => {
                      const dateStr = format(day, 'yyyy-MM-dd')
                      const dayTasks = tasksByDay[dateStr] || []
                      const color = dayColor(dayTasks)
                      const today = isToday(day)

                      return (
                        <button
                          key={dateStr}
                          onClick={() => onSelectDate?.(dateStr)}
                          title={`${dateStr}${dayTasks.length > 0 ? ` — ${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''}` : ''}`}
                          className={cn(
                            'aspect-square flex items-center justify-center rounded-sm text-[10px] font-medium transition-colors',
                            color,
                            !color && today && 'ring-1 ring-primary text-primary',
                            !color && !today && 'text-foreground hover:bg-muted/60',
                            onSelectDate && 'cursor-pointer hover:opacity-80'
                          )}
                        >
                          {format(day, 'd')}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
