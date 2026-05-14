import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuthStore } from '../../store/authStore'

export interface Profile {
  full_name: string | null
  target_exam_name: string | null
  avatar_url: string | null
}

export function useProfile() {
  const { session } = useAuthStore()
  return useQuery<Profile | null>({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      if (!session) return null
      const { data } = await supabase
        .from('profiles')
        .select('full_name, target_exam_name, avatar_url')
        .eq('user_id', session.user.id)
        .maybeSingle()
      return (data as Profile | null)
    },
    enabled: !!session,
    staleTime: 60_000,
  })
}
