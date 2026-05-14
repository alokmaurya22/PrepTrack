import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { AppShell } from './components/layout/AppShell'
import { AuthPage } from './pages/AuthPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { SyllabusPage } from './pages/SyllabusPage'
import { PlannerPage } from './pages/PlannerPage'
import { PomodoroPage } from './pages/PomodoroPage'
import { NotesPage } from './pages/NotesPage'
import { KeyNotesPage } from './pages/KeyNotesPage'
import { ResourcesPage } from './pages/ResourcesPage'
import { TestsPage } from './pages/TestsPage'
import { CurrentAffairsPage } from './pages/CurrentAffairsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { SettingsPage } from './pages/SettingsPage'
import { PYQPage } from './pages/PYQPage'
import { MainsAnswerPage } from './pages/MainsAnswerPage'
import { DoubtsPage } from './pages/DoubtsPage'
import { ExamCalendarPage } from './pages/ExamCalendarPage'
import { GoalsPage } from './pages/GoalsPage'
import { QuickRefPage } from './pages/QuickRefPage'
import { ReadingListPage } from './pages/ReadingListPage'
import { AIPage } from './pages/AIPage'
import { AchievementsPage } from './pages/AchievementsPage'
import { TimetablePage } from './pages/TimetablePage'
import { RevisionPage } from './pages/RevisionPage'
import { HabitsPage } from './pages/HabitsPage'
import { FeaturesPage } from './pages/FeaturesPage'
import { GuidePage } from './pages/GuidePage'
import { useEffect } from 'react'
import { applyTheme, useThemeStore } from './store/themeStore'

export default function App() {
  const { session, loading } = useAuthStore()
  const theme = useThemeStore((s) => s.theme)

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

  if (!session) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="*" element={<AuthPage />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/plan" element={<PlannerPage />} />
          <Route path="/pomodoro" element={<PomodoroPage />} />
          <Route path="/syllabus" element={<SyllabusPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/key-notes" element={<KeyNotesPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/pyq" element={<PYQPage />} />
          <Route path="/mains-answers" element={<MainsAnswerPage />} />
          <Route path="/current-affairs" element={<CurrentAffairsPage />} />
          <Route path="/analytics"      element={<AnalyticsPage />} />
          <Route path="/goals"          element={<GoalsPage />} />
          <Route path="/doubts"         element={<DoubtsPage />} />
          <Route path="/exam-calendar"  element={<ExamCalendarPage />} />
          <Route path="/quick-ref"      element={<QuickRefPage />} />
          <Route path="/reading-list"   element={<ReadingListPage />} />
          <Route path="/ai"             element={<AIPage />} />
          <Route path="/achievements"   element={<AchievementsPage />} />
          <Route path="/timetable"      element={<TimetablePage />} />
          <Route path="/revision"       element={<RevisionPage />} />
          <Route path="/habits"         element={<HabitsPage />} />
          <Route path="/settings"       element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
