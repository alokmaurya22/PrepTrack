import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { AppShell } from './components/layout/AppShell'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { useEffect } from 'react'
import { applyTheme, useThemeStore } from './store/themeStore'

export default function App() {
  const { session, loading } = useAuthStore()
  const theme = useThemeStore((s) => s.theme)

  // Apply theme on mount
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!session) return <AuthPage />

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/plan" element={<div className="text-muted-foreground">Planner — Coming in Phase 4</div>} />
          <Route path="/syllabus" element={<div className="text-muted-foreground">Syllabus — Coming in Phase 3</div>} />
          <Route path="/notes" element={<div className="text-muted-foreground">Notes — Coming in Phase 6</div>} />
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