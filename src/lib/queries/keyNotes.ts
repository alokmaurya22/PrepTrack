import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'
import { calculateNextReview, getDefaultSM2State, type SM2State } from '../utils/sm2'

export interface KeyNote {
  id: string
  user_id: string
  note_id: string | null
  syllabus_node_id: string | null
  front_text: string
  back_text: string
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_at: string | null
  last_reviewed_at: string | null
  created_at: string
}

export function useDueKeyNotes() {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['key-notes', 'due'],
    enabled: !!session,
    queryFn: async () => {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('key_notes')
        .select('*')
        .eq('user_id', session!.user.id)
        .or(`next_review_at.is.null,next_review_at.lte.${now}`)
        .order('next_review_at', { ascending: true, nullsFirst: true })
        .limit(50)
      if (error) throw error
      return data as KeyNote[]
    },
  })
}

export function useAllKeyNotes() {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['key-notes', 'all'],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('key_notes')
        .select('*')
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as KeyNote[]
    },
  })
}

export function useCreateKeyNote() {
  const { session } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (note: {
      front_text: string
      back_text: string
      syllabus_node_id?: string
      note_id?: string
    }) => {
      const sm2 = getDefaultSM2State()
      const { data, error } = await supabase
        .from('key_notes')
        .insert({
          user_id: session!.user.id,
          front_text: note.front_text,
          back_text: note.back_text,
          syllabus_node_id: note.syllabus_node_id || null,
          note_id: note.note_id || null,
          ease_factor: sm2.ease_factor,
          interval_days: sm2.interval_days,
          repetitions: sm2.repetitions,
          next_review_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) throw error
      return data as KeyNote
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['key-notes'] })
      toast.success('Flashcard created')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useReviewKeyNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      quality,
      currentState,
    }: {
      id: string
      quality: 0 | 1 | 2 | 3
      currentState: SM2State
    }) => {
      const result = calculateNextReview(currentState, quality)
      const nextReviewDate = new Date()
      nextReviewDate.setDate(nextReviewDate.getDate() + result.next_review_days)

      const { error } = await supabase
        .from('key_notes')
        .update({
          ease_factor: result.ease_factor,
          interval_days: result.interval_days,
          repetitions: result.repetitions,
          next_review_at: nextReviewDate.toISOString(),
          last_reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['key-notes'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeleteKeyNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('key_notes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['key-notes'] })
      toast.success('Flashcard deleted')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}