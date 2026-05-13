import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'

export interface Note {
  id: string
  user_id: string
  title: string
  content_json: Record<string, unknown> | null
  content_md: string | null
  tags: string[]
  is_pinned: boolean
  is_deleted: boolean
  version_number: number
  created_at: string
  updated_at: string
}

export function useNotes() {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['notes'],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', session!.user.id)
        .eq('is_deleted', false)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data as Note[]
    },
  })
}

export function useNote(noteId: string) {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['notes', noteId],
    enabled: !!session && !!noteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single()
      if (error) throw error
      return data as Note
    },
  })
}

export function useCreateNote() {
  const { session } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (note: { title?: string; content_md?: string; tags?: string[] }) => {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: session!.user.id,
          title: note.title || 'Untitled Note',
          content_md: note.content_md || '',
          tags: note.tags || [],
        })
        .select()
        .single()
      if (error) throw error
      return data as Note
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      toast.success('Note created')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Note> & { id: string }) => {
      const payload: Record<string, unknown> = {}
      if (updates.title !== undefined) payload.title = updates.title
      if (updates.content_md !== undefined) payload.content_md = updates.content_md
      if (updates.tags !== undefined) payload.tags = updates.tags
      if (updates.is_pinned !== undefined) payload.is_pinned = updates.is_pinned
      const { error } = await supabase.from('notes').update(payload).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      qc.invalidateQueries({ queryKey: ['notes', variables.id] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeleteNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('notes')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', noteId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      toast.success('Note moved to trash')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useSearchNotes(query: string) {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['notes', 'search', query],
    enabled: !!session && query.length > 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', session!.user.id)
        .eq('is_deleted', false)
        .or(`title.ilike.%${query}%,content_md.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return data as Note[]
    },
  })
}