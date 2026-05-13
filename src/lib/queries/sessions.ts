import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'

export interface StudySession {
  id: string
  user_id: string
  task_id: string | null
  started_at: string
  ended_at: string | null
  duration_minutes: number | null
  session_type: 'focus' | 'break' | 'long_break'
  focus_score: number | null
  note: string | null
}

export function useTodaySessions() {
  const { session } = useAuthStore()
  const today = new Date().toISOString().split('T')[0]
  return useQuery({
    queryKey: ['sessions', 'today', today],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', session!.user.id)
        .gte('started_at', today)
        .order('started_at', { ascending: false })
      if (error) throw error
      return data as StudySession[]
    },
  })
}

export function useSessionsForDate(date: string) {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['sessions', date],
    enabled: !!session,
    queryFn: async () => {
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', session!.user.id)
        .gte('started_at', date)
        .lt('started_at', nextDay.toISOString().split('T')[0])
        .order('started_at', { ascending: false })
      if (error) throw error
      return data as StudySession[]
    },
  })
}

export function useStartSession() {
  const { session } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { task_id?: string; session_type?: string }) => {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: session!.user.id,
          task_id: vars.task_id || null,
          session_type: vars.session_type || 'focus',
          started_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) throw error
      return data as StudySession
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useEndSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: {
      sessionId: string
      focusScore?: number
      note?: string
    }) => {
      const { data: session, error: fetchErr } = await supabase
        .from('study_sessions')
        .select('started_at')
        .eq('id', vars.sessionId)
        .single()
      if (fetchErr) throw fetchErr

      const started = new Date(session.started_at)
      const now = new Date()
      const duration = Math.round((now.getTime() - started.getTime()) / 60000)

      const { error } = await supabase
        .from('study_sessions')
        .update({
          ended_at: now.toISOString(),
          duration_minutes: duration,
          focus_score: vars.focusScore ?? null,
          note: vars.note ?? null,
        })
        .eq('id', vars.sessionId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}