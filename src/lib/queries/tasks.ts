import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'

export interface Task {
  id: string
  user_id: string
  parent_task_id: string | null
  title: string
  description: string | null
  type: 'syllabus' | 'revision' | 'test_pyq' | 'answer_writing' | 'current_affairs' | 'custom'
  syllabus_node_id: string | null
  target_date: string | null
  target_start_time: string | null
  target_end_time: string | null
  estimated_minutes: number | null
  actual_minutes: number | null
  priority: 'p1' | 'p2' | 'p3'
  status: 'pending' | 'in_progress' | 'completed' | 'partial' | 'skipped' | 'cancelled'
  skip_reason: string | null
  recurrence_rule: string | null
  recurrence_parent_id: string | null
  reminder_at: string | null
  completed_at: string | null
  sort_order: number
}

export function useTasksForDate(date: string) {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['tasks', 'date', date],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session!.user.id)
        .eq('target_date', date)
        .order('sort_order')
        .order('target_start_time')
      if (error) throw error
      return data as Task[]
    },
  })
}

export function useTasksForWeek(startDate: string, endDate: string) {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['tasks', 'week', startDate, endDate],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session!.user.id)
        .gte('target_date', startDate)
        .lte('target_date', endDate)
        .order('target_date')
        .order('sort_order')
      if (error) throw error
      return data as Task[]
    },
  })
}

export function useTasksForMonth(year: number, month: number) {
  const { session } = useAuthStore()
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`
  return useQuery({
    queryKey: ['tasks', 'month', year, month],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session!.user.id)
        .gte('target_date', startDate)
        .lte('target_date', endDate)
        .order('target_date')
      if (error) throw error
      return data as Task[]
    },
  })
}

export function useTasksForDateRange(startDate: string, endDate: string) {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['tasks', 'range', startDate, endDate],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session!.user.id)
        .gte('target_date', startDate)
        .lte('target_date', endDate)
        .order('target_date')
      if (error) throw error
      return data as Task[]
    },
  })
}

export function useCreateTask() {
  const { session } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const { error } = await supabase.from('tasks').insert({
        user_id: session!.user.id,
        title: task.title,
        description: task.description || null,
        type: task.type || 'custom',
        syllabus_node_id: task.syllabus_node_id || null,
        target_date: task.target_date || null,
        target_start_time: task.target_start_time || null,
        target_end_time: task.target_end_time || null,
        estimated_minutes: task.estimated_minutes || null,
        priority: task.priority || 'p2',
        status: task.status || 'pending',
        recurrence_rule: task.recurrence_rule || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task created')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const payload: Record<string, unknown> = {}
      const fields = [
        'title', 'description', 'type', 'syllabus_node_id', 'target_date',
        'target_start_time', 'target_end_time', 'estimated_minutes', 'actual_minutes',
        'priority', 'status', 'skip_reason', 'sort_order',
      ]
      for (const f of fields) {
        if (updates[f as keyof typeof updates] !== undefined) {
          payload[f] = updates[f as keyof typeof updates]
        }
      }
      if (updates.status === 'completed') {
        payload.completed_at = new Date().toISOString()
      }
      const { error } = await supabase.from('tasks').update(payload).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}