import { supabase } from '../supabase'
import { useAuthStore } from '../../store/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface Habit {
  id: string
  user_id: string
  name: string
  description: string | null
  icon: string
  color: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface HabitLog {
  id: string
  user_id: string
  habit_id: string
  date: string
}

export function useHabits() {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['habits', session?.user?.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', session!.user.id)
        .eq('is_active', true)
        .order('sort_order')
        .order('created_at')
      if (error) throw error
      return data as Habit[]
    },
  })
}

export function useHabitLogsForRange(startDate: string, endDate: string) {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['habit-logs', startDate, endDate, session?.user?.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', session!.user.id)
        .gte('date', startDate)
        .lte('date', endDate)
      if (error) throw error
      return data as HabitLog[]
    },
  })
}

export function useCreateHabit() {
  const { session } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (habit: Pick<Habit, 'name' | 'icon' | 'color'> & { description?: string }) => {
      const { error } = await supabase.from('habits').insert({
        user_id: session!.user.id,
        name: habit.name,
        description: habit.description || null,
        icon: habit.icon || '✅',
        color: habit.color || '#6366f1',
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] })
      toast.success('Habit added')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useArchiveHabit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('habits').update({ is_active: false }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] })
      toast.success('Habit removed')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useToggleHabitLog() {
  const { session } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ habitId, date, done }: { habitId: string; date: string; done: boolean }) => {
      if (done) {
        const { error } = await supabase.from('habit_logs').upsert(
          { user_id: session!.user.id, habit_id: habitId, date },
          { onConflict: 'user_id,habit_id,date' }
        )
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('user_id', session!.user.id)
          .eq('habit_id', habitId)
          .eq('date', date)
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habit-logs'] }),
    onError: (e: Error) => toast.error(e.message),
  })
}
