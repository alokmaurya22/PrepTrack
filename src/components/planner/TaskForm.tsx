import { useState } from 'react'
import { X } from 'lucide-react'
import { useCreateTask, useUpdateTask, type Task } from '../../lib/queries/tasks'

interface Props {
  date: string
  task?: Task | null
  onClose: () => void
}

const TASK_TYPES = [
  { value: 'custom', label: 'Custom' },
  { value: 'syllabus', label: 'Syllabus' },
  { value: 'revision', label: 'Revision' },
  { value: 'test_pyq', label: 'Test / PYQ' },
  { value: 'answer_writing', label: 'Answer Writing' },
  { value: 'current_affairs', label: 'Current Affairs' },
]

const PRIORITIES = [
  { value: 'p1', label: 'P1 — High' },
  { value: 'p2', label: 'P2 — Medium' },
  { value: 'p3', label: 'P3 — Low' },
]

export function TaskForm({ date, task, onClose }: Props) {
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const isEdit = !!task

  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [type, setType] = useState<string>(task?.type || 'custom')
  const [priority, setPriority] = useState<string>(task?.priority || 'p2')
  const [estimatedMinutes, setEstimatedMinutes] = useState(task?.estimated_minutes?.toString() || '')
  const [startTime, setStartTime] = useState(task?.target_start_time || '')
  const [endTime, setEndTime] = useState(task?.target_end_time || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      type: type as Task['type'],
      priority: priority as Task['priority'],
      target_date: date,
      target_start_time: startTime || undefined,
      target_end_time: endTime || undefined,
      estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
    }

    if (isEdit) {
      updateTask.mutate({ id: task!.id, ...payload }, { onSuccess: onClose })
    } else {
      createTask.mutate(payload as Partial<Task>, { onSuccess: onClose })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">
            {isEdit ? 'Edit Task' : 'New Task'}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full mt-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {TASK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full mt-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Est. (min)</label>
              <input
                type="number"
                placeholder="60"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                min={1}
                className="w-full mt-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full mt-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">End</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full mt-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={createTask.isPending || updateTask.isPending || !title.trim()}
              className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isEdit ? 'Save Changes' : createTask.isPending ? 'Creating…' : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}