import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  GraduationCap, BookOpen, CalendarDays, Timer, Sparkles, BarChart2,
  Newspaper, List, Target, Flame, HelpCircle, CalendarCheck2,
  Star, Layers, ClipboardList, Repeat, BookMarked, Trophy,
  ArrowRight, Menu, X, Lightbulb, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { cn } from '../lib/utils'

// ─── Section definitions ──────────────────────────────────────────────────────

interface Step { text: string }
interface Tip  { type: 'tip' | 'note' | 'warning'; text: string }
type ContentBlock = { kind: 'steps'; items: Step[] } | { kind: 'tip'; data: Tip } | { kind: 'para'; text: string }

interface GuideSection {
  id: string
  icon: React.ElementType
  title: string
  color: string
  tagline: string
  blocks: ContentBlock[]
}

const SECTIONS: GuideSection[] = [
  {
    id: 'getting-started',
    icon: GraduationCap,
    title: 'Getting Started',
    color: 'violet',
    tagline: 'Create your account and set up your profile in under 2 minutes.',
    blocks: [
      { kind: 'steps', items: [
        { text: 'Open PrepTrack and click "Get Started" or visit the Sign Up page.' },
        { text: 'Enter your email and a password (minimum 6 characters), then click "Create account".' },
        { text: 'Check your email for a verification link and click it to activate your account.' },
        { text: 'Sign in and complete the onboarding — choose your exam, optional subject, and medium of study.' },
        { text: 'You\'re in! The Dashboard is your home base.' },
      ]},
      { kind: 'tip', data: { type: 'tip', text: 'You can also sign in with Google for a one-click login experience.' }},
      { kind: 'tip', data: { type: 'note', text: 'If you were given an Access Key by your coach or institute, click "Use Access Key" on the login screen and enter it — no email or password needed.' }},
    ],
  },
  {
    id: 'dashboard',
    icon: BarChart2,
    title: 'Dashboard',
    color: 'indigo',
    tagline: 'A bird\'s-eye view of your entire preparation at a glance.',
    blocks: [
      { kind: 'para', text: 'The Dashboard shows four live stat cards (Today\'s Tasks, Focus Time, Study Streak, Syllabus %) plus your pending tasks for today and quick-access links to every module.' },
      { kind: 'steps', items: [
        { text: 'The greeting banner changes based on time of day and shows your current streak.' },
        { text: 'Click any stat card or quick-access button to jump directly to that module.' },
        { text: 'Pending tasks show with priority colour — red for P1, amber for P2, muted for P3.' },
      ]},
      { kind: 'tip', data: { type: 'tip', text: 'Bookmark the Dashboard — it\'s the best place to start every study session.' }},
    ],
  },
  {
    id: 'syllabus',
    icon: BookOpen,
    title: 'Syllabus Tracker',
    color: 'blue',
    tagline: 'Build your own subject tree and track every topic\'s completion.',
    blocks: [
      { kind: 'para', text: 'The Syllabus Tracker is the backbone of PrepTrack. Everything — timetable, analytics, revision — is powered by the data here.' },
      { kind: 'steps', items: [
        { text: 'Click "Add Subject" in the top-right to create your first subject (e.g. History, Polity, Geography).' },
        { text: 'Once a subject exists, click "Add Topic" and pick which subject to add it under.' },
        { text: 'For each topic, enter a name, choose Stage (Prelims/Mains/Interview), Paper, and time estimate in Days + Hours.' },
        { text: 'Select the current status: Not Started / In Progress / Completed / Needs Revision.' },
        { text: 'Topics can have sub-topics — hover any topic row and click the "+" icon to go deeper.' },
        { text: 'Change status at any time using the inline dropdown on each row.' },
        { text: 'The summary bar at the top shows your subjects count, total topics, completed, remaining, and total hours left.' },
      ]},
      { kind: 'tip', data: { type: 'tip', text: 'Use the time estimate honestly — the Timetable Generator uses it to plan your schedule.' }},
      { kind: 'tip', data: { type: 'note', text: '"Needs Revision" topics remain in the pending pool for the Timetable Generator — they\'re not treated as done.' }},
      { kind: 'tip', data: { type: 'warning', text: 'Deleting a subject also deletes all topics under it. This cannot be undone.' }},
    ],
  },
  {
    id: 'timetable',
    icon: CalendarDays,
    title: 'Timetable Generator',
    color: 'violet',
    tagline: 'Auto-schedule every remaining topic across your available study days.',
    blocks: [
      { kind: 'steps', items: [
        { text: 'Go to Timetable from the sidebar or Dashboard quick-access.' },
        { text: 'Set your Exam Date — topics will be distributed up to this date.' },
        { text: 'Drag the "Study hours per day" slider to match your realistic daily capacity.' },
        { text: 'Choose break days: No breaks, Sundays off, or Weekends off.' },
        { text: 'Click "Generate Plan" — the app distributes your remaining (non-completed) syllabus topics across available study days.' },
        { text: 'Browse the weekly plan. Click "Create Tasks in Planner" to push every day\'s topics into the Daily Planner as tasks.' },
      ]},
      { kind: 'tip', data: { type: 'tip', text: 'Re-generate whenever you complete a batch of topics — the plan will shrink accordingly.' }},
      { kind: 'tip', data: { type: 'note', text: 'Topics are sorted by Paper order (GS1 → GS2 → GS3 → GS4 → Essay → Optional) then by sort order within each paper.' }},
    ],
  },
  {
    id: 'planner',
    icon: ClipboardList,
    title: 'Daily Planner',
    color: 'emerald',
    tagline: 'Manage today\'s task list with priorities and time estimates.',
    blocks: [
      { kind: 'steps', items: [
        { text: 'Open Planner (sidebar → Plan) — defaults to today\'s date.' },
        { text: 'Click "+ Add Task" and enter a title, priority (P1 / P2 / P3), and estimated minutes.' },
        { text: 'Navigate days using the arrow buttons to plan ahead or review past days.' },
        { text: 'Check off tasks as you complete them — they move to the "Done" section.' },
        { text: 'Link a Pomodoro session to a task using the Pomodoro Timer\'s task selector.' },
      ]},
      { kind: 'tip', data: { type: 'tip', text: 'P1 tasks are the most critical. Keep these to 1–3 per day and do them first.' }},
    ],
  },
  {
    id: 'pomodoro',
    icon: Timer,
    title: 'Pomodoro Timer',
    color: 'red',
    tagline: 'Focused work sprints with automatic session logging.',
    blocks: [
      { kind: 'para', text: 'The Pomodoro Technique divides study into focused intervals (typically 25 min) separated by short breaks. Every completed session is stored and feeds your Analytics.' },
      { kind: 'steps', items: [
        { text: 'Open Pomodoro from the sidebar.' },
        { text: 'Adjust Focus, Short Break, and Long Break durations in Settings → Pomodoro if needed.' },
        { text: 'Select a task from the dropdown (shows today\'s incomplete tasks) — optional but recommended.' },
        { text: 'Click Start. The timer counts down.' },
        { text: 'On completion, a break timer starts automatically. After 4 focus sessions, a Long Break triggers.' },
        { text: 'Each session is saved and visible in Analytics.' },
      ]},
      { kind: 'tip', data: { type: 'tip', text: 'Phone on airplane mode + Pomodoro running = maximum focus. No exceptions.' }},
    ],
  },
  {
    id: 'flashcards',
    icon: Star,
    title: 'Key Notes & Flashcards',
    color: 'yellow',
    tagline: 'Learn facts and retain them using scientifically-proven spaced repetition.',
    blocks: [
      { kind: 'para', text: 'Key Notes are flashcards with two sides (Question / Answer). The app schedules reviews using the SM-2 algorithm — cards you know well appear less often; cards you struggle with appear more frequently.' },
      { kind: 'steps', items: [
        { text: 'Go to Key Notes → click "+ Add Card".' },
        { text: 'Write a concise Question on the front and the Answer on the back.' },
        { text: 'Click "Start Review" to begin your due-card session.' },
        { text: 'Read the question, mentally answer, then click the card to flip and see the answer.' },
        { text: 'Rate your recall: Forgot (0) / Hard (1) / Good (2) / Easy (3).' },
        { text: 'The app calculates your next review date based on the rating.' },
        { text: 'Review daily — even 10 minutes of flashcard practice compounds over time.' },
      ]},
      { kind: 'tip', data: { type: 'tip', text: 'Keep questions atomic — one fact per card. "What is Article 32?" not "Explain all fundamental rights."' }},
      { kind: 'tip', data: { type: 'note', text: 'The library tab shows all your cards. Click any to flip it. Hover to see the delete button.' }},
    ],
  },
  {
    id: 'current-affairs',
    icon: Newspaper,
    title: 'Current Affairs',
    color: 'blue',
    tagline: 'Log and categorise daily news that matters for your exam.',
    blocks: [
      { kind: 'steps', items: [
        { text: 'Click "+ Add Entry" and enter a headline or key point.' },
        { text: 'Set the date, category (Economy, Polity, Environment, etc.), and source name (The Hindu, PIB, etc.).' },
        { text: 'Optionally add a URL and detailed notes.' },
        { text: 'Filter entries using the source filter pills at the top.' },
        { text: 'Use the search bar to quickly find a specific topic.' },
      ]},
      { kind: 'tip', data: { type: 'tip', text: 'Log entries daily — catching up on a week\'s backlog is demoralising. 5 minutes each morning works better.' }},
    ],
  },
  {
    id: 'reading-list',
    icon: BookMarked,
    title: 'Reading List',
    color: 'cyan',
    tagline: 'Track every book, article, and video in your study material.',
    blocks: [
      { kind: 'steps', items: [
        { text: 'Click "+ Add" and enter the title, type (Book / Article / Video / PDF / Other), and URL if applicable.' },
        { text: 'Set status: Want to Read / Reading / Completed / Dropped.' },
        { text: 'For material in progress, update the Progress % as you go.' },
        { text: 'Add notes to capture key takeaways.' },
        { text: 'Filter by status or type using the top filter row.' },
      ]},
      { kind: 'tip', data: { type: 'tip', text: 'Use "Priority" field to mark must-reads — tackle those before optional material.' }},
    ],
  },
  {
    id: 'analytics',
    icon: BarChart2,
    title: 'Analytics',
    color: 'purple',
    tagline: 'Understand your study patterns through data.',
    blocks: [
      { kind: 'para', text: 'Analytics pulls together Pomodoro session data, task completions, and syllabus progress into visual reports.' },
      { kind: 'steps', items: [
        { text: 'Open Analytics from the sidebar.' },
        { text: 'The 7-day bar chart shows daily focus minutes for the past week.' },
        { text: 'The 28-day heatmap shows study intensity — darker cells = more hours that day.' },
        { text: 'Syllabus completion doughnut tracks your overall topic progress.' },
        { text: 'Hover any heatmap cell to see the exact minutes studied on that day.' },
      ]},
      { kind: 'tip', data: { type: 'tip', text: 'Look for patterns — if you consistently study less on Wednesdays, investigate why and fix it.' }},
    ],
  },
  {
    id: 'pyq',
    icon: List,
    title: 'PYQ Tracker',
    color: 'amber',
    tagline: 'Track which previous year questions you\'ve solved across all papers.',
    blocks: [
      { kind: 'steps', items: [
        { text: 'Open PYQ from the sidebar.' },
        { text: 'Select the paper (Prelims GS, Mains GS1–GS4, Essay, CSAT, etc.) from the top tab.' },
        { text: 'The grid shows years (1979–2025) across the top and papers down the side.' },
        { text: 'Click a cell to mark that paper-year combination as attempted.' },
        { text: 'The summary row shows how many years you\'ve covered per paper.' },
      ]},
      { kind: 'tip', data: { type: 'tip', text: 'Start with the last 10 years — they have the highest return on investment for pattern recognition.' }},
    ],
  },
  {
    id: 'revision',
    icon: Repeat,
    title: 'Revision Tracker',
    color: 'teal',
    tagline: 'Never miss a revision with a schedule based on your confidence.',
    blocks: [
      { kind: 'para', text: 'The Revision Tracker shows topics from your syllabus that have been marked "Completed" or "Needs Revision" and schedules them based on the confidence rating you gave.' },
      { kind: 'steps', items: [
        { text: 'Open Revision from the sidebar.' },
        { text: 'Topics due for revision today appear at the top in red.' },
        { text: 'Click a topic row to mark it revised — it reschedules automatically.' },
        { text: 'Confidence 1–2 → revisit in 1 day. Confidence 3 → 3 days. Confidence 4 → 7 days. Confidence 5 → 14 days.' },
      ]},
      { kind: 'tip', data: { type: 'tip', text: 'Rate confidence honestly in the Syllabus tracker. That rating drives the revision schedule.' }},
    ],
  },
  {
    id: 'goals',
    icon: Target,
    title: 'Goals',
    color: 'emerald',
    tagline: 'Set measurable study goals and track your progress toward them.',
    blocks: [
      { kind: 'steps', items: [
        { text: 'Click "+ New Goal" and write a clear, specific goal (e.g. "Complete Polity syllabus by 30 June").' },
        { text: 'Set a deadline and a target metric (number of topics, chapters, hours, etc.).' },
        { text: 'Mark milestones as complete as you progress.' },
        { text: 'Goals widget appears on the Dashboard for constant visibility.' },
      ]},
      { kind: 'tip', data: { type: 'tip', text: 'Use the SMART framework: Specific, Measurable, Achievable, Relevant, Time-bound.' }},
    ],
  },
  {
    id: 'habits',
    icon: Flame,
    title: 'Habits',
    color: 'orange',
    tagline: 'Build daily study habits with streak tracking.',
    blocks: [
      { kind: 'steps', items: [
        { text: 'Open Habits from the sidebar → click "+ Add Habit".' },
        { text: 'Name the habit (e.g. "Read newspaper", "20 flashcards", "30 min Pomodoro").' },
        { text: 'Each day, tick the habit as done. A streak counter tracks consecutive completions.' },
        { text: 'Missing a day resets the streak — the pressure to maintain it is the motivator.' },
      ]},
      { kind: 'tip', data: { type: 'tip', text: 'Start with just 2–3 habits. Adding 10 at once leads to none being followed.' }},
    ],
  },
  {
    id: 'quick-ref',
    icon: Layers,
    title: 'Quick Reference',
    color: 'indigo',
    tagline: 'One-page cheat sheets for rapid revision before the exam.',
    blocks: [
      { kind: 'steps', items: [
        { text: 'Open Quick Ref → "+ Add Card" to create a reference card with a title and content.' },
        { text: 'Use the card for formulas, dates, constitutional articles, committees, etc.' },
        { text: 'Switch to Quiz Mode to test yourself — the answer is hidden until you tap "Reveal".' },
        { text: 'Cards support rich text so you can add bullet lists and bold key terms.' },
      ]},
    ],
  },
  {
    id: 'doubts',
    icon: HelpCircle,
    title: 'Doubts Tracker',
    color: 'pink',
    tagline: 'Never let an unanswered question slip through the cracks.',
    blocks: [
      { kind: 'steps', items: [
        { text: 'While studying, when you hit a question you can\'t answer, open Doubts → "+ Add Doubt".' },
        { text: 'Write the question clearly and tag it with a subject.' },
        { text: 'After clarification (from books, a mentor, or the AI Assistant), click "Resolve".' },
        { text: 'Filter by subject or status to review pending doubts.' },
      ]},
      { kind: 'tip', data: { type: 'tip', text: 'Don\'t stop your study session to resolve doubts in real time. Log it here and address them in a dedicated "doubt-clearing" slot.' }},
    ],
  },
  {
    id: 'exam-calendar',
    icon: CalendarCheck2,
    title: 'Exam Calendar',
    color: 'amber',
    tagline: 'All critical dates in one place — never miss a notification.',
    blocks: [
      { kind: 'steps', items: [
        { text: 'Open Exam Calendar from the sidebar.' },
        { text: 'Add exam events: notification date, application start/end, admit card, exam date, result.' },
        { text: 'Each event shows a live countdown in days.' },
        { text: 'Past dates are greyed out automatically.' },
      ]},
      { kind: 'tip', data: { type: 'tip', text: 'Add all dates for your target exams at the start of the year. Forgetting a form date is the costliest mistake.' }},
    ],
  },
  {
    id: 'ai',
    icon: Sparkles,
    title: 'AI Assistant',
    color: 'violet',
    tagline: 'Ask study questions and get instant, accurate explanations.',
    blocks: [
      { kind: 'steps', items: [
        { text: 'Go to Settings → AI tab and enter your OpenRouter API key.' },
        { text: 'Open the AI page from the sidebar.' },
        { text: 'Type any study question — concepts, comparisons, mnemonics, essay outlines.' },
        { text: 'The response is formatted with headings and bullet points for readability.' },
      ]},
      { kind: 'tip', data: { type: 'tip', text: 'Get an OpenRouter API key for free at openrouter.ai — your API key is stored locally and never sent to our servers.' }},
      { kind: 'tip', data: { type: 'note', text: 'Use AI to understand concepts, not to write your answers for you. Active recall outperforms passive reading every time.' }},
    ],
  },
  {
    id: 'achievements',
    icon: Trophy,
    title: 'Achievements',
    color: 'yellow',
    tagline: 'Earn badges for milestones — study progress should feel rewarding.',
    blocks: [
      { kind: 'para', text: 'Achievements are automatically unlocked as you reach milestones in the app. They serve as checkpoints that acknowledge your consistency and hard work.' },
      { kind: 'steps', items: [
        { text: 'Open Achievements from the sidebar to see your unlocked and locked badges.' },
        { text: 'Examples: First Flashcard, 7-Day Streak, 50 Topics Completed, 100 Pomodoros.' },
        { text: 'Badge notifications appear at the bottom of the screen when unlocked.' },
      ]},
      { kind: 'tip', data: { type: 'tip', text: 'Progress is motivating. Check this page when you feel demotivated — seeing how far you\'ve come often reignites energy.' }},
    ],
  },
]

const COLOR_CLASSES: Record<string, { icon: string; badge: string; border: string; dot: string }> = {
  violet: { icon: 'text-violet-500', badge: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300', border: 'border-l-violet-500', dot: 'bg-violet-500' },
  blue:   { icon: 'text-blue-500',   badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',         border: 'border-l-blue-500',   dot: 'bg-blue-500'   },
  indigo: { icon: 'text-indigo-500', badge: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300', border: 'border-l-indigo-500', dot: 'bg-indigo-500' },
  emerald:{ icon: 'text-emerald-500',badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',border:'border-l-emerald-500',dot:'bg-emerald-500'},
  red:    { icon: 'text-red-500',    badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',             border: 'border-l-red-500',    dot: 'bg-red-500'    },
  amber:  { icon: 'text-amber-500',  badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',     border: 'border-l-amber-500',  dot: 'bg-amber-500'  },
  rose:   { icon: 'text-rose-500',   badge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',         border: 'border-l-rose-500',   dot: 'bg-rose-500'   },
  yellow: { icon: 'text-yellow-500', badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300', border: 'border-l-yellow-500', dot: 'bg-yellow-500' },
  purple: { icon: 'text-purple-500', badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300', border: 'border-l-purple-500',  dot: 'bg-purple-500' },
  teal:   { icon: 'text-teal-500',   badge: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',         border: 'border-l-teal-500',   dot: 'bg-teal-500'   },
  orange: { icon: 'text-orange-500', badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300', border: 'border-l-orange-500', dot: 'bg-orange-500' },
  cyan:   { icon: 'text-cyan-500',   badge: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',         border: 'border-l-cyan-500',   dot: 'bg-cyan-500'   },
  pink:   { icon: 'text-pink-500',   badge: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',         border: 'border-l-pink-500',   dot: 'bg-pink-500'   },
}

function TipBox({ data }: { data: Tip }) {
  const styles = {
    tip:     { bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', icon: <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />, label: 'Tip', labelColor: 'text-emerald-700 dark:text-emerald-400' },
    note:    { bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',             icon: <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />,   label: 'Note', labelColor: 'text-blue-700 dark:text-blue-400' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',         icon: <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />,  label: 'Warning', labelColor: 'text-amber-700 dark:text-amber-400' },
  }
  const s = styles[data.type]
  return (
    <div className={`rounded-lg border p-3.5 flex gap-2.5 ${s.bg}`}>
      {s.icon}
      <p className="text-sm text-foreground/80 leading-relaxed">
        <span className={`font-semibold ${s.labelColor}`}>{s.label}: </span>
        {data.text}
      </p>
    </div>
  )
}

export function GuidePage() {
  const { session } = useAuthStore()
  const [activeId, setActiveId] = useState(SECTIONS[0].id)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  // Scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          const top = visible.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b
          )
          setActiveId(top.target.id)
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    )
    SECTIONS.forEach(({ id }) => {
      const el = sectionRefs.current[id]
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-1.5 rounded-md hover:bg-muted text-muted-foreground"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-bold text-base tracking-tight">PrepTrack</span>
            </Link>
            <span className="text-muted-foreground hidden sm:block">/ User Guide</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link to="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Features
            </Link>
            {session ? (
              <Link to="/" className="flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors">
                Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <Link to="/auth" className="flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors">
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">

        {/* ── Sidebar — desktop ── */}
        <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0 h-[calc(100vh-56px)] sticky top-14 overflow-y-auto border-r border-border py-6 pr-4 pl-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-2">Modules</p>
          <nav className="space-y-0.5">
            {SECTIONS.map(({ id, icon: Icon, title, color }) => {
              const c = COLOR_CLASSES[color] ?? COLOR_CLASSES.violet
              const isActive = activeId === id
              return (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all text-left',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-primary' : c.icon)} />
                  <span className="truncate">{title}</span>
                  {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* ── Mobile sidebar overlay ── */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute left-0 top-14 bottom-0 w-64 bg-background border-r border-border overflow-y-auto py-6 px-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-2">Modules</p>
              <nav className="space-y-0.5">
                {SECTIONS.map(({ id, icon: Icon, title, color }) => {
                  const c = COLOR_CLASSES[color] ?? COLOR_CLASSES.violet
                  return (
                    <button
                      key={id}
                      onClick={() => scrollTo(id)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-left"
                    >
                      <Icon className={cn('h-4 w-4 flex-shrink-0', c.icon)} />
                      <span>{title}</span>
                    </button>
                  )
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 py-10 px-4 sm:px-8 max-w-3xl">

          {/* Hero */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 border border-primary/20">
              <BookOpen className="h-3.5 w-3.5" />
              Complete User Guide
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-3">
              How to use PrepTrack
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              A module-by-module walkthrough of every feature — from setting up your syllabus on day one to tracking your progress on exam eve.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-16">
            {SECTIONS.map(({ id, icon: Icon, title, color, tagline, blocks }) => {
              const c = COLOR_CLASSES[color] ?? COLOR_CLASSES.violet
              return (
                <section
                  key={id}
                  id={id}
                  ref={(el) => { sectionRefs.current[id] = el }}
                  className={cn('border-l-4 pl-6 scroll-mt-20', c.border)}
                >
                  {/* Section header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={cn('p-2 rounded-lg mt-0.5', `bg-${color}-100 dark:bg-${color}-900/30`)}>
                      <Icon className={cn('h-5 w-5', c.icon)} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{tagline}</p>
                    </div>
                  </div>

                  {/* Content blocks */}
                  <div className="space-y-4">
                    {blocks.map((block, bi) => {
                      if (block.kind === 'para') {
                        return (
                          <p key={bi} className="text-sm text-muted-foreground leading-relaxed">
                            {block.text}
                          </p>
                        )
                      }
                      if (block.kind === 'tip') {
                        return <TipBox key={bi} data={block.data} />
                      }
                      // steps
                      return (
                        <ol key={bi} className="space-y-2.5">
                          {block.items.map((step, si) => (
                            <li key={si} className="flex items-start gap-3">
                              <span className={cn('flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5', c.dot)}>
                                {si + 1}
                              </span>
                              <p className="text-sm text-foreground/80 leading-relaxed pt-0.5">{step.text}</p>
                            </li>
                          ))}
                        </ol>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 rounded-2xl bg-gradient-to-br from-primary via-violet-600 to-indigo-700 p-8 text-white text-center">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-white/80" />
            <h3 className="text-xl font-bold mb-2">You're ready to go!</h3>
            <p className="text-white/70 text-sm mb-5 max-w-sm mx-auto">
              Start with the Syllabus Tracker, generate a timetable, and do your first Pomodoro session — that's all you need for day one.
            </p>
            {session ? (
              <Link to="/" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white text-primary font-bold hover:bg-white/90 transition-colors text-sm">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link to="/auth" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white text-primary font-bold hover:bg-white/90 transition-colors text-sm">
                Create free account <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
