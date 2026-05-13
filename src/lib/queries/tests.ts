import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'

export interface Test {
  id: string
  user_id: string
  name: string
  date: string
  source: string | null
  type: 'prelims' | 'mains' | 'sectional' | 'full_length' | 'pyq' | 'other'
  total_marks: number
  scored_marks: number
  time_taken_minutes: number | null
  notes: string | null
  created_at: string
}

export interface TestMistake {
  id: string
  user_id: string
  test_id: string
  question_text: string | null
  image_url: string | null
  correct_answer: string | null
  your_answer: string | null
  syllabus_node_id: string | null
  reasoning: string | null
  created_at: string
}

export function useTests() {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['tests'],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('user_id', session!.user.id)
        .order('date', { ascending: false })
      if (error) throw error
      return data as Test[]
    },
  })
}

export function useCreateTest() {
  const { session } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (test: Omit<Test, 'id' | 'user_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('tests')
        .insert({ ...test, user_id: session!.user.id })
        .select()
        .single()
      if (error) throw error
      return data as Test
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tests'] })
      toast.success('Test logged')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeleteTest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tests').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tests'] })
      qc.invalidateQueries({ queryKey: ['test-mistakes'] })
      toast.success('Test deleted')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useTestMistakes(testId: string) {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['test-mistakes', testId],
    enabled: !!session && !!testId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_mistakes')
        .select('*')
        .eq('test_id', testId)
        .order('created_at')
      if (error) throw error
      return data as TestMistake[]
    },
  })
}

export function useAllMistakes() {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['test-mistakes', 'all'],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_mistakes')
        .select('*')
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as TestMistake[]
    },
  })
}

export function useAddMistake() {
  const { session } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (mistake: {
      test_id: string
      question_text?: string
      correct_answer?: string
      your_answer?: string
      syllabus_node_id?: string
      reasoning?: string
    }) => {
      const { error } = await supabase.from('test_mistakes').insert({
        user_id: session!.user.id,
        test_id: mistake.test_id,
        question_text: mistake.question_text || null,
        correct_answer: mistake.correct_answer || null,
        your_answer: mistake.your_answer || null,
        syllabus_node_id: mistake.syllabus_node_id || null,
        reasoning: mistake.reasoning || null,
      })
      if (error) throw error

      // Auto-create revision task for the mistake
      if (mistake.syllabus_node_id) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        await supabase.from('tasks').insert({
          user_id: session!.user.id,
          title: `Revise mistake from test`,
          type: 'revision',
          syllabus_node_id: mistake.syllabus_node_id,
          target_date: tomorrow.toISOString().split('T')[0],
          priority: 'p1',
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['test-mistakes'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Mistake logged — revision task created')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeleteMistake() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('test_mistakes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['test-mistakes'] })
      toast.success('Mistake deleted')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}