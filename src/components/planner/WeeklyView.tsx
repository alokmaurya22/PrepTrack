import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { format, addDays, startOfWeek, endOfWeek, isToday, isSameDay } from 'date-fns'
import { useTasksForWeek, type Task } from '../../lib/queries/tasks'
import { cn } from '../../lib/utils'
import { TaskForm } from './TaskForm'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Props {
  onSelectDate?: (date: string) => void
}

export function WeeklyView({ onSelectDate }: Props) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const startStr = format(weekStart, 'yyyy-MM-dd')
  const endStr = format(weekEnd, 'yyyy-MM-dd')

  const { data: tasks, isLoading } = useTasksForWeek(startStr, endStr)

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

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

  const prevWeek = () => setWeekStart((w) => addDays(w, -7))
  const nextWeek = () => setWeekStart((w) => addDays(w, 7))
  const goToday = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
    setSelectedDate(new Date())
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
          <button onClick={prevWeek} className="p-1 rounded hover:bg-muted">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <h2 className="text-sm font-semibold text-foreground tabular-nums">
            {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
          </h2>
          <button onClick={nextWeek} className="p-1 rounded hover:bg-muted">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={goToday}
            className="text-xs text-primary hover:underline px-2 py-0.5"
          >
            Today
          </button>
        </div>
        <button
          onClick={() => {
            setEditingTask(null)
            setShowForm(true)
          }}
          className="flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Task
        </button>
      </div>

      {/* Week grid */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 grid grid-cols-7 divide-x divide-border">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayTasks = tasksByDay[dateStr] || []
            const isSelected = isSameDay(day, selectedDate)
            const today = isToday(day)

            return (
              <div
                key={dateStr}
                className={cn(
                  'flex flex-col overflow-hidden',
                  isSelected && 'bg-primary/3'
                )}
              >
                {/* Day header */}
                <button
                  onClick={() => {
                    if (onSelectDate) onSelectDate(dateStr)
                    else setSelectedDate(day)
                  }}
                  className={cn(
                    'text-center py-2 border-b border-border flex-shrink-0',
                    today && 'bg-primary/10'
                  )}
                >
                  <div className="text-xs text-muted-foreground">{DAY_NAMES[day.getDay() === 0 ? 6 : day.getDay() - 1]}</div>
                  <div
                    className={cn(
                      'text-lg font-bold tabular-nums',
                      today ? 'text-primary' : 'text-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                </button>

                {/* Day tasks */}
                <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => {
                        if (onSelectDate) {
                          onSelectDate(dateStr)
                        } else {
                          setEditingTask(task)
                          setShowForm(true)
                        }
                      }}
                      className={cn(
                        'text-xs px-2 py-1 rounded cursor-pointer truncate transition-colors',
                        task.status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 line-through'
                          : task.priority === 'p1'
                            ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                            : 'bg-muted text-foreground hover:bg-muted/70'
                      )}
                    >
                      {task.title}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          date={editingTask?.target_date || format(selectedDate, 'yyyy-MM-dd')}
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