import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTasksForDate, type Task } from '../../lib/queries/tasks'
import { TaskCard } from './TaskCard'
import { TaskForm } from './TaskForm'

interface Props {
  date: string
  dateLabel: string
}

export function DailyView({ date, dateLabel }: Props) {
  const { data: tasks, isLoading } = useTasksForDate(date)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const pending = tasks?.filter((t) => t.status !== 'completed') || []
  const completed = tasks?.filter((t) => t.status === 'completed') || []

  const totalEst = pending.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0)
  const doneCount = completed.length
  const totalCount = (tasks || []).length

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
        <div>
          <h2 className="text-lg font-semibold text-foreground">{dateLabel}</h2>
          <p className="text-xs text-muted-foreground">
            {totalEst} min planned · {doneCount}/{totalCount} done
          </p>
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

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {pending.length === 0 && completed.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No tasks for this day</p>
            <p className="text-xs text-muted-foreground mt-1">Click "Add Task" to plan your study</p>
          </div>
        )}

        {pending.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={(t) => {
              setEditingTask(t)
              setShowForm(true)
            }}
          />
        ))}

        {completed.length > 0 && pending.length > 0 && (
          <div className="pt-3 mt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2 px-1">Completed</p>
            {completed.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(t) => {
                  setEditingTask(t)
                  setShowForm(true)
                }}
              />
            ))}
          </div>
        )}

        {pending.length === 0 && completed.length > 0 && (
          <>
            {completed.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(t) => {
                  setEditingTask(t)
                  setShowForm(true)
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          date={date}
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