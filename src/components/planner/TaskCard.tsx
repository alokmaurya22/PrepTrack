import { useState } from 'react'
import { Check, Clock, Edit2, Trash2, MoreHorizontal } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useUpdateTask, useDeleteTask, type Task } from '../../lib/queries/tasks'

interface Props {
  task: Task
  onEdit: (task: Task) => void
}

const PRIORITY_COLORS = {
  p1: 'border-l-red-500',
  p2: 'border-l-amber-500',
  p3: 'border-l-blue-500',
}

const TYPE_LABELS: Record<string, string> = {
  syllabus: 'Syllabus',
  revision: 'Revision',
  test_pyq: 'Test/PYQ',
  answer_writing: 'Answer',
  current_affairs: 'CA',
  custom: 'Custom',
}

export function TaskCard({ task, onEdit }: Props) {
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const [showMenu, setShowMenu] = useState(false)

  const isCompleted = task.status === 'completed'
  const isInProgress = task.status === 'in_progress'

  const toggleComplete = () => {
    updateTask.mutate({
      id: task.id,
      status: isCompleted ? 'pending' : 'completed',
    })
  }

  const toggleInProgress = () => {
    updateTask.mutate({
      id: task.id,
      status: isInProgress ? 'pending' : 'in_progress',
    })
  }

  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors border-l-4',
        PRIORITY_COLORS[task.priority] || 'border-l-muted',
        isCompleted && 'opacity-60'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={toggleComplete}
        className={cn(
          'mt-0.5 h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
          isCompleted
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-muted-foreground/30 hover:border-primary'
        )}
      >
        {isCompleted && <Check className="h-3 w-3" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-medium',
              isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
            )}
          >
            {task.title}
          </span>
          <span className="text-[10px] px-1.5 py-px rounded-full bg-muted text-muted-foreground">
            {TYPE_LABELS[task.type] || task.type}
          </span>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
        )}

        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          {task.target_start_time && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.target_start_time}
              {task.target_end_time && ` – ${task.target_end_time}`}
            </span>
          )}
          {task.estimated_minutes && (
            <span>{task.estimated_minutes} min</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-opacity"
        >
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-8 z-20 w-36 bg-card border border-border rounded-lg shadow-lg py-1">
              {!isCompleted && (
                <button
                  onClick={() => {
                    toggleInProgress()
                    setShowMenu(false)
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-muted flex items-center gap-2"
                >
                  <Clock className="h-3 w-3" />
                  {isInProgress ? 'Pause' : 'Start'}
                </button>
              )}
              <button
                onClick={() => {
                  onEdit(task)
                  setShowMenu(false)
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-muted flex items-center gap-2"
              >
                <Edit2 className="h-3 w-3" />
                Edit
              </button>
              <button
                onClick={() => {
                  deleteTask.mutate(task.id)
                  setShowMenu(false)
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-destructive hover:bg-muted flex items-center gap-2"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}