import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'

export interface SyllabusNode {
  id: string
  parent_id: string | null
  level: number
  code: string
  title: string
  description: string | null
  default_hours: number
  stage: 'prelims' | 'mains' | 'interview' | null
  paper: string | null
  optional_subject_id: number | null
  language_id: number | null
  is_leaf: boolean
  sort_order: number
  metadata: Record<string, unknown>
}

export interface UserProgress {
  id: string
  user_id: string
  syllabus_node_id: string
  status: 'not_started' | 'in_progress' | 'completed' | 'needs_revision'
  confidence_rating: number | null
  hours_estimated_override: number | null
  hours_spent: number
  last_revised_at: string | null
  next_revision_at: string | null
  completed_at: string | null
  revision_count: number
}

export interface NodeSource {
  id: string
  user_id: string
  syllabus_node_id: string
  type: 'book' | 'video' | 'url' | 'other'
  title: string
  url: string | null
  notes: string | null
}

export function useSyllabusNodes(parentId: string | null = null) {
  return useQuery({
    queryKey: ['syllabus', parentId],
    queryFn: async () => {
      const query = supabase
        .from('syllabus_nodes')
        .select('*')
        .order('sort_order')

      if (parentId === null) {
        const { data, error } = await query.is('parent_id', null)
        if (error) throw error
        return data as SyllabusNode[]
      } else {
        const { data, error } = await query.eq('parent_id', parentId)
        if (error) throw error
        return data as SyllabusNode[]
      }
    },
  })
}

export function useAllSyllabusNodes() {
  return useQuery({
    queryKey: ['syllabus', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('syllabus_nodes')
        .select('*')
        .order('sort_order')
      if (error) throw error
      return data as SyllabusNode[]
    },
    staleTime: 1000 * 60 * 30, // 30 min — rarely changes
  })
}

export function useSyllabusNode(nodeId: string) {
  return useQuery({
    queryKey: ['syllabus', 'node', nodeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('syllabus_nodes')
        .select('*')
        .eq('id', nodeId)
        .single()
      if (error) throw error
      return data as SyllabusNode
    },
    enabled: !!nodeId,
  })
}

export function useUserProgress() {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['syllabus-progress', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_syllabus_progress')
        .select('*')
        .eq('user_id', session!.user.id)
      if (error) throw error
      return Object.fromEntries(
        (data as UserProgress[]).map(r => [r.syllabus_node_id, r])
      ) as Record<string, UserProgress>
    },
  })
}

export function useUpdateProgress() {
  const { session } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: {
      nodeId: string
      status: string
      confidence?: number
      hoursOverride?: number
    }) => {
      const payload: Record<string, unknown> = {
        user_id: session!.user.id,
        syllabus_node_id: vars.nodeId,
        status: vars.status,
        completed_at:
          vars.status === 'completed' ? new Date().toISOString() : null,
        next_revision_at:
          vars.status === 'completed'
            ? new Date(Date.now() + 86400000).toISOString() // Day 1 revision
            : undefined,
      }

      if (vars.confidence !== undefined) {
        payload.confidence_rating = vars.confidence
      }

      if (vars.hoursOverride !== undefined) {
        payload.hours_estimated_override = vars.hoursOverride
      }

      const { error } = await supabase
        .from('user_syllabus_progress')
        .upsert(payload, { onConflict: 'user_id,syllabus_node_id' })

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['syllabus-progress'] })
      toast.success('Progress updated')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useNodeSources(nodeId: string) {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['node-sources', nodeId],
    enabled: !!session && !!nodeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('node_sources')
        .select('*')
        .eq('user_id', session!.user.id)
        .eq('syllabus_node_id', nodeId)
        .order('created_at')
      if (error) throw error
      return data as NodeSource[]
    },
  })
}

export function useAddNodeSource() {
  const { session } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (source: {
      syllabus_node_id: string
      type: string
      title: string
      url?: string
      notes?: string
    }) => {
      const { error } = await supabase.from('node_sources').insert({
        user_id: session!.user.id,
        syllabus_node_id: source.syllabus_node_id,
        type: source.type,
        title: source.title,
        url: source.url || null,
        notes: source.notes || null,
      })
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ['node-sources', variables.syllabus_node_id],
      })
      toast.success('Source added')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteNodeSource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      sourceId,
    }: {
      sourceId: string
      nodeId: string
    }) => {
      const { error } = await supabase
        .from('node_sources')
        .delete()
        .eq('id', sourceId)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['node-sources', variables.nodeId] })
      toast.success('Source removed')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useSearchSyllabus(query: string) {
  return useQuery({
    queryKey: ['syllabus-search', query],
    enabled: query.length > 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('syllabus_nodes')
        .select('*')
        .ilike('title', `%${query}%`)
        .order('level')
        .limit(50)
      if (error) throw error
      return data as SyllabusNode[]
    },
  })
}