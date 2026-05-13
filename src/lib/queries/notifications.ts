import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuthStore } from '../../store/authStore'


export interface Notification {
  id: string
  user_id: string
  title: string
  body: string | null
  type: 'info' | 'success' | 'warning' | 'reminder'
  is_read: boolean
  link: string | null
  created_at: string
}

export function useNotifications() {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['notifications'],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as Notification[]
    },
  })
}

export function useUnreadCount() {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['notifications', 'unread'],
    enabled: !!session,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session!.user.id)
        .eq('is_read', false)
      if (error) throw error
      return count || 0
    },
    refetchInterval: 30000,
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllRead() {
  const { session } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', session!.user.id)
        .eq('is_read', false)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}