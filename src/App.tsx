import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { AppShell } from './components/layout/AppShell'
import { AuthPage } from './pages/AuthPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { SyllabusPage } from './pages/SyllabusPage'
import { PlannerPage } from './pages/PlannerPage'
import { PomodoroPage } from './pages/PomodoroPage'
import { NotesPage } from './pages/NotesPage'
import { useEffect, useState } from 'react'
import { applyTheme, useThemeStore } from './store/themeStore'
import { supabase } from './lib/supabase'

export default function App() {
  const { session, loading } = useAuthStore()
  const theme = useThemeStore((s) => s.theme)
  const [checkingOnboarding, setCheckingOnboarding] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null)

  // Apply theme on mount
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Check if user has completed onboarding
  useEffect(() => {
    if (!session) {
      setNeedsOnboarding(null)
      return
    }
    setCheckingOnboarding(true)
    supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('user_id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          // Profile might not exist yet — show onboarding
          setNeedsOnboarding(true)
        } else {
          setNeedsOnboarding(!data.onboarding_completed)
        }
        setCheckingOnboarding(false)
      })
  }, [session])

  if (loading || checkingOnboarding) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<AuthPage />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<AppShell />}>
          <Route path="/" element={needsOnboarding ? <Navigate to="/onboarding" replace /> : <DashboardPage />} />
          <Route path="/plan" element={<PlannerPage />} />
          <Route path="/pomodoro" element={<PomodoroPage />} />
          <Route path="/syllabus" element={<SyllabusPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/resources" element={<div className="text-muted-foreground">Resources — Coming in Phase 8</div>} />
          <Route path="/tests" element={<div className="text-muted-foreground">Tests — Coming in Phase 9</div>} />
          <Route path="/current-affairs" element={<div className="text-muted-foreground">Current Affairs — Coming in Phase 10</div>} />
          <Route path="/analytics" element={<div className="text-muted-foreground">Analytics — Coming in Phase 12</div>} />
          <Route path="/ai" element={<div className="text-muted-foreground">AI Assistant — Coming in Phase 13</div>} />
          <Route path="/settings" element={<div className="text-muted-foreground">Settings — Coming in Phase 15</div>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
