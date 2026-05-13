import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'

export interface Attachment {
  id: string
  user_id: string
  file_path: string
  file_name: string
  mime_type: string
  size_bytes: number
  folder_path: string | null
  deleted_at: string | null
  created_at: string
}

export function useAttachments(folderPath: string | null = null) {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['attachments', folderPath],
    enabled: !!session,
    queryFn: async () => {
      let query = supabase
        .from('attachments')
        .select('*')
        .eq('user_id', session!.user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (folderPath === null) {
        query = query.is('folder_path', null)
      } else {
        query = query.eq('folder_path', folderPath)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Attachment[]
    },
  })
}

export function useTrashAttachments() {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['attachments', 'trash'],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('user_id', session!.user.id)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
      if (error) throw error
      return data as Attachment[]
    },
  })
}

export function useStorageUsage() {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['attachments', 'storage'],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attachments')
        .select('size_bytes')
        .eq('user_id', session!.user.id)
        .is('deleted_at', null)
      if (error) throw error
      const total = (data as { size_bytes: number }[]).reduce(
        (sum, r) => sum + r.size_bytes,
        0
      )
      return total
    },
  })
}

export function useDeleteAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('attachments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments'] })
      toast.success('File moved to trash')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function usePermanentDeleteAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('attachments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments'] })
      toast.success('File permanently deleted')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useRestoreAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('attachments')
        .update({ deleted_at: null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments'] })
      toast.success('File restored')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useGetFileUrl() {
  return useMutation({
    mutationFn: async (filePath: string) => {
      const { data } = await supabase.storage
        .from('user-files')
        .createSignedUrl(filePath, 3600)
      return data?.signedUrl || null
    },
  })
}