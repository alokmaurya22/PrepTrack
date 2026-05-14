import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'

export interface PYQQuestion {
  id: string
  user_id: string
  year: number
  paper: string
  question_number: number | null
  question_text: string | null
  status: 'not_attempted' | 'correct' | 'wrong' | 'skipped'
  your_answer: string | null
  notes: string | null
  created_at: string
}

export interface MainsAnswer {
  id: string
  user_id: string
  test_id: string | null
  question_text: string
  answer_image_url: string | null
  answer_text: string | null
  syllabus_node_id: string | null
  structure_rating: number | null
  content_rating: number | null
  diagram_rating: number | null
  conclusion_rating: number | null
  review_notes: string | null
  created_at: string
}

export function usePYQQuestions(year: number, paper: string) {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['pyq', year, paper],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pyq_questions')
        .select('*')
        .eq('user_id', session!.user.id)
        .eq('year', year)
        .eq('paper', paper)
        .order('question_number')
      if (error) throw error
      return data as PYQQuestion[]
    },
  })
}

export function usePYQSummary() {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['pyq', 'summary'],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pyq_questions')
        .select('year,paper,status')
        .eq('user_id', session!.user.id)
      if (error) throw error
      return data as Pick<PYQQuestion, 'year' | 'paper' | 'status'>[]
    },
  })
}

export function useAddPYQ() {
  const { session } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (q: { year: number; paper: string; question_number?: number; question_text?: string; status?: string; your_answer?: string; notes?: string }) => {
      const { error } = await supabase.from('pyq_questions').insert({
        user_id: session!.user.id,
        year: q.year,
        paper: q.paper,
        question_number: q.question_number || null,
        question_text: q.question_text || null,
        status: q.status || 'not_attempted',
        your_answer: q.your_answer || null,
        notes: q.notes || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pyq'] })
      toast.success('Question added')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdatePYQ() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PYQQuestion> & { id: string }) => {
      const { error } = await supabase.from('pyq_questions').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pyq'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeletePYQ() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pyq_questions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pyq'] })
      toast.success('Question deleted')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useMainsAnswers() {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['mains-answers'],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mains_answers')
        .select('*')
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as MainsAnswer[]
    },
  })
}

export function useAddMainsAnswer() {
  const { session } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (a: { question_text: string; answer_text?: string; structure_rating?: number; content_rating?: number; diagram_rating?: number; conclusion_rating?: number; review_notes?: string }) => {
      const { error } = await supabase.from('mains_answers').insert({
        user_id: session!.user.id,
        question_text: a.question_text,
        answer_text: a.answer_text || null,
        structure_rating: a.structure_rating || null,
        content_rating: a.content_rating || null,
        diagram_rating: a.diagram_rating || null,
        conclusion_rating: a.conclusion_rating || null,
        review_notes: a.review_notes || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mains-answers'] })
      toast.success('Answer logged')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeleteMainsAnswer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mains_answers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mains-answers'] })
      toast.success('Answer deleted')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}