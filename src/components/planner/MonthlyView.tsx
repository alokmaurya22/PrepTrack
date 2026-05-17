import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isSameDay } from 'date-fns'
import { useTasksForMonth, type Task } from '../../lib/queries/tasks'
import { cn } from '../../lib/utils'
import { TaskForm } from './TaskForm'

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Props {
  onSelectDate?: (date: string) => void
}

export function MonthlyView({ onSelectDate }: Props) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState<Date>(today)
  const [selectedDate, setSelectedDate] = useState<Date>(today)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth() + 1

  const { data: tasks, isLoading } = useTasksForMonth(year, month)

  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {}
    tasks?.forEach((task) => {
      if (task.target_date) {
        if (!map[task.target_date]) map[task.target_date] = []
        map[task.target_date].push(task)
      }
    })
    return map
  }, [tasks])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDayOfWeek = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1

  const prevMonth = () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
  const goToday = () => {
    setCurrentMonth(new Date())
    setSelectedDate(new Date())
  }

  const getDayCompletion = (dateStr: string) => {
    const dayTasks = tasksByDay[dateStr] || []
    if (dayTasks.length === 0) return null
    const done = dayTasks.filter((t) => t.status === 'completed').length
    return { done, total: dayTasks.length }
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground animate-pulse">
        Loading tasks…
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-muted">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <h2 className="text-sm font-semibold text-foreground">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button onClick={nextMonth} className="p-1 rounded hover:bg-muted">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={goToday} className="text-xs text-primary hover:underline px-2 py-0.5">
            Today
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAY_HEADERS.map((day) => (
            <div key={day} className="text-center py-1.5 text-[11px] font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
          {/* Empty cells before first day */}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="border-r border-b border-border/50 bg-muted/20" />
          ))}

          {/* Actual days */}
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayTasks = tasksByDay[dateStr] || []
            const comp = getDayCompletion(dateStr)
            const isSelected = isSameDay(day, selectedDate)
            const todayMatch = isToday(day)

            return (
              <button
                key={dateStr}
                onClick={() => {
                  if (onSelectDate) {
                    onSelectDate(dateStr)
                  } else {
                    setSelectedDate(day)
                    setEditingTask(null)
                    setShowForm(true)
                  }
                }}
                className={cn(
                  'border-r border-b border-border/50 p-1.5 text-left hover:bg-muted/30 transition-colors relative flex flex-col',
                  isSelected && 'bg-primary/5',
                  todayMatch && 'bg-primary/10'
                )}
              >
                <span
                  className={cn(
                    'text-xs font-medium tabular-nums mb-1',
                    todayMatch ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {format(day, 'd')}
                </span>

                {comp && (
                  <span className="text-[10px] text-muted-foreground mb-0.5">
                    {comp.done}/{comp.total}
                  </span>
                )}

                <div className="space-y-0.5 min-h-0 overflow-hidden">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        'text-[10px] px-1 py-0.5 rounded truncate',
                        task.status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 line-through'
                          : task.priority === 'p1'
                            ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                            : 'bg-muted/70 text-foreground'
                      )}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{dayTasks.length - 3} more</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          date={format(selectedDate, 'yyyy-MM-dd')}
          task={editingTask}
          onClose={() => {
            setShowForm(false)
            setEditingTask(null)
          }}
        />
      )}
    </div>
  )
}