import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'

export interface DailyLog {
  id: string
  user_id: string
  date: string
  planned_minutes: number
  actual_minutes: number
  completion_pct: number | null
  mood: number | null
  energy: number | null
  reflection_text: string | null
}

export function useDailyLog(date: string) {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['daily-log', date],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', session!.user.id)
        .eq('date', date)
        .maybeSingle()
      if (error && error.code !== 'PGRST116') throw error
      return data as DailyLog | null
    },
  })
}

export function useDailyLogsForRange(startDate: string, endDate: string) {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['daily-logs', startDate, endDate],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', session!.user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date')
      if (error) throw error
      return data as DailyLog[]
    },
  })
}

export function useSaveDailyLog() {
  const { session } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (log: Partial<DailyLog> & { date: string }) => {
      const { error } = await supabase.from('daily_logs').upsert(
        {
          user_id: session!.user.id,
          date: log.date,
          planned_minutes: log.planned_minutes ?? 0,
          actual_minutes: log.actual_minutes ?? 0,
          completion_pct: log.completion_pct ?? null,
          mood: log.mood ?? null,
          energy: log.energy ?? null,
          reflection_text: log.reflection_text ?? null,
        },
        { onConflict: 'user_id,date' }
      )
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['daily-log', variables.date] })
      qc.invalidateQueries({ queryKey: ['daily-logs'] })
      toast.success('Log saved')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}