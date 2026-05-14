import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'

export interface CAEntry {
  id: string
  user_id: string
  date: string
  source_url: string | null
  source_name: string | null
  title: string
  summary: string | null
  tags: string[]
  syllabus_node_ids: string[] | null
  created_at: string
}

export function useCAEntries(month?: string) {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['ca-entries', month],
    enabled: !!session,
    queryFn: async () => {
      let query = supabase
        .from('ca_entries')
        .select('*')
        .eq('user_id', session!.user.id)
        .order('date', { ascending: false })

      if (month) {
        query = query
          .gte('date', `${month}-01`)
          .lte('date', `${month}-31`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as CAEntry[]
    },
  })
}

export function useTodayCA() {
  const { session } = useAuthStore()
  const today = new Date().toISOString().split('T')[0]
  return useQuery({
    queryKey: ['ca-entries', 'today', today],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ca_entries')
        .select('*')
        .eq('user_id', session!.user.id)
        .eq('date', today)
        .limit(1)
      if (error) throw error
      return data as CAEntry[]
    },
  })
}

export function useCreateCAEntry() {
  const { session } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entry: {
      date: string
      title: string
      source_url?: string
      source_name?: string
      summary?: string
      tags?: string[]
    }) => {
      const { error } = await supabase.from('ca_entries').insert({
        user_id: session!.user.id,
        date: entry.date,
        title: entry.title,
        source_url: entry.source_url || null,
        source_name: entry.source_name || null,
        summary: entry.summary || null,
        tags: entry.tags || [],
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ca-entries'] })
      toast.success('CA entry saved')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeleteCAEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ca_entries').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ca-entries'] })
      toast.success('Entry deleted')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useSearchCA(query: string) {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['ca-entries', 'search', query],
    enabled: !!session && query.length > 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ca_entries')
        .select('*')
        .eq('user_id', session!.user.id)
        .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
        .order('date', { ascending: false })
        .limit(30)
      if (error) throw error
      return data as CAEntry[]
    },
  })
}