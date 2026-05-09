import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  session: Session | null
  loading: boolean
  setSession: (session: Session | null) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => {
  supabase.auth.getSession().then(({ data }) => {
    set({ session: data.session, loading: false })
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    set({ session, loading: false })
  })

  return {
    session: null,
    loading: true,
    setSession: (session) => set({ session }),
    signOut: async () => {
      await supabase.auth.signOut()
      set({ session: null })
    },
  }
})