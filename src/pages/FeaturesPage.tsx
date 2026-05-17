import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  BookOpen, CalendarDays, Timer, Sparkles, BarChart2,
  FileText, Newspaper, List, Target, Flame, HelpCircle, CalendarCheck2,
  Star, Brain, Layers, ClipboardList, Repeat, BookMarked, Trophy,
  ArrowRight, CheckCircle2, Zap, Clock,
} from 'lucide-react'

const FEATURES = [
  {
    category: 'Planning & Scheduling',
    color: 'violet',
    items: [
      { icon: BookOpen,      title: 'Syllabus Tracker',       desc: 'Build your own subject & topic tree. Set time estimates, mark status, and watch your completion % grow in real time.' },
      { icon: CalendarDays,  title: 'Timetable Generator',    desc: 'Enter your exam date and daily study hours — the app auto-distributes your remaining topics across available days.' },
      { icon: ClipboardList, title: 'Daily Planner',          desc: 'Add tasks with priority levels (P1–P3), link them to Pomodoro sessions, and track daily completion.' },
      { icon: Target,        title: 'Goals',                  desc: 'Set short and long-term study goals with deadlines. Monitor progress against each goal.' },
    ],
  },
  {
    category: 'Active Study',
    color: 'blue',
    items: [
      { icon: Timer,         title: 'Pomodoro Timer',         desc: 'Customise focus and break durations. Link each session to a task. Every session is logged for analytics.' },
      { icon: Star,          title: 'Key Notes & Flashcards', desc: 'Create front/back flashcards with spaced-repetition scheduling. Rate recall quality — Forgot / Hard / Good / Easy.' },
      { icon: Layers,        title: 'Quick Reference',        desc: 'Build condensed reference cards for fast revision. Switch to quiz mode for self-testing.' },
      { icon: Repeat,        title: 'Revision Tracker',       desc: 'Spaced revision schedule based on confidence ratings. See exactly what needs revisiting today.' },
    ],
  },
  {
    category: 'Content & Research',
    color: 'emerald',
    items: [
      { icon: Newspaper,     title: 'Current Affairs',        desc: 'Log news entries with date, source, and category. Filter by source or time range for focused review.' },
      { icon: BookMarked,    title: 'Reading List',           desc: 'Track books, articles, and videos. Log reading progress (%), add notes, and filter by status.' },
      { icon: FileText,      title: 'Notes',                  desc: 'A distraction-free space for general notes, summaries, and mind-maps organised by topic.' },
      { icon: HelpCircle,    title: 'Doubts Tracker',         desc: 'Log unanswered questions while studying. Mark them resolved as you get answers.' },
    ],
  },
  {
    category: 'Test Preparation',
    color: 'amber',
    items: [
      { icon: List,          title: 'PYQ Tracker',            desc: 'Track previous year questions from 1979–2025 across all papers. Mark solved/unsolved by year.' },
      { icon: Brain,         title: 'Mains Answer Writing',   desc: 'Log practice answers and rate yourself on 4 dimensions: Structure, Content, Diagrams, Conclusion.' },
      { icon: CalendarCheck2,title: 'Exam Calendar',          desc: 'Stay on top of notification dates, admit card releases, and exam day countdowns.' },
    ],
  },
  {
    category: 'Tracking & Motivation',
    color: 'rose',
    items: [
      { icon: BarChart2,     title: 'Analytics',              desc: '28-day study heatmap, daily focus-time chart, and syllabus completion breakdown — all at a glance.' },
      { icon: Flame,         title: 'Habits',                 desc: 'Build daily study habits with streak tracking. A missed day resets the chain — stay consistent.' },
      { icon: Trophy,        title: 'Achievements',           desc: 'Unlock badges for milestones: first flashcard, 7-day streak, 50 topics completed, and more.' },
    ],
  },
  {
    category: 'AI & Smart Tools',
    color: 'indigo',
    items: [
      { icon: Sparkles,      title: 'AI Assistant',           desc: 'Ask study questions, get concept explanations, or generate mnemonics — powered by your OpenRouter API key.' },
      { icon: Zap,           title: 'Access Key Login',       desc: 'Share a single access key with a student for instant login — no email or password needed.' },
    ],
  },
]

const COLOR_MAP: Record<string, { bg: string; border: string; icon: string; badge: string; heading: string }> = {
  violet: { bg: 'bg-violet-50 dark:bg-violet-950/20', border: 'border-violet-200 dark:border-violet-800', icon: 'text-violet-600 dark:text-violet-400', badge: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300', heading: 'text-violet-700 dark:text-violet-300' },
  blue:   { bg: 'bg-blue-50 dark:bg-blue-950/20',     border: 'border-blue-200 dark:border-blue-800',     icon: 'text-blue-600 dark:text-blue-400',     badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',     heading: 'text-blue-700 dark:text-blue-300'   },
  emerald:{ bg: 'bg-emerald-50 dark:bg-emerald-950/20',border:'border-emerald-200 dark:border-emerald-800',icon: 'text-emerald-600 dark:text-emerald-400',badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',heading:'text-emerald-700 dark:text-emerald-300'},
  amber:  { bg: 'bg-amber-50 dark:bg-amber-950/20',   border: 'border-amber-200 dark:border-amber-800',   icon: 'text-amber-600 dark:text-amber-400',   badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',   heading: 'text-amber-700 dark:text-amber-300' },
  rose:   { bg: 'bg-rose-50 dark:bg-rose-950/20',     border: 'border-rose-200 dark:border-rose-800',     icon: 'text-rose-600 dark:text-rose-400',     badge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',     heading: 'text-rose-700 dark:text-rose-300'   },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/20', border: 'border-indigo-200 dark:border-indigo-800', icon: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300', heading: 'text-indigo-700 dark:text-indigo-300'},
}

const STATS = [
  { value: '20+', label: 'Modules' },
  { value: 'SM-2', label: 'Spaced Repetition' },
  { value: '28-day', label: 'Study Heatmap' },
  { value: '100%', label: 'Your Data' },
]

export function FeaturesPage() {
  const { session } = useAuthStore()

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/preptrack_logo.png" alt="PrepTrack" className="h-6 w-6 rounded-md" />
            <span className="font-bold text-lg tracking-tight">PrepTrack</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/guide" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              User Guide
            </Link>
            {session ? (
              <Link to="/" className="flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90 transition-colors">
                Go to Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <Link to="/auth" className="flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90 transition-colors">
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-violet-500/5 to-indigo-500/10 pointer-events-none" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-violet-500/5 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 border border-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            Built for serious exam preparation
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-5">
            Everything you need to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-500 to-indigo-500">
              crack your exam
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            PrepTrack is an all-in-one study platform — syllabus management, spaced-repetition
            flashcards, AI assistance, analytics, and more. Built for students who want structure,
            not chaos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {session ? (
              <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25">
                Open Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link to="/auth" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25">
                Start for free <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <Link to="/guide" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-card text-foreground font-semibold hover:bg-muted transition-colors">
              Read the Guide <BookOpen className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-y border-border bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-extrabold text-primary">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature categories ── */}
      <section className="max-w-6xl mx-auto px-4 py-16 space-y-14">
        {FEATURES.map(({ category, color, items }) => {
          const c = COLOR_MAP[color]
          return (
            <div key={category}>
              {/* Category label */}
              <div className="flex items-center gap-3 mb-6">
                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${c.badge}`}>
                  {category}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Cards grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {items.map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className={`group relative rounded-xl border p-5 transition-all hover:shadow-md hover:-translate-y-0.5 ${c.bg} ${c.border}`}
                  >
                    <div className="mb-3">
                      <Icon className={`h-6 w-6 ${c.icon}`} />
                    </div>
                    <h3 className="font-semibold text-foreground text-sm mb-1.5">{title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </section>

      {/* ── Why PrepTrack ── */}
      <section className="border-t border-border bg-muted/20">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-extrabold mb-4">Why PrepTrack?</h2>
          <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
            Most students juggle 5+ apps — a notes app, a planner, a timer, a tracker, and a revision tool. PrepTrack puts everything in one place.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-left">
            {[
              { icon: CheckCircle2, title: 'Structured Progress', desc: 'Your syllabus becomes a living checklist. Every topic has a status, a time estimate, and feeds into your timetable.', color: 'text-emerald-500' },
              { icon: Clock,        title: 'Spaced Repetition',   desc: 'Flashcards and revision schedules follow SM-2 algorithm — you review topics at exactly the right intervals.', color: 'text-blue-500' },
              { icon: BarChart2,    title: 'Data-Driven Study',   desc: 'The 28-day heatmap and focus analytics show patterns in your study habits so you can improve them.', color: 'text-violet-500' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6">
                <Icon className={`h-7 w-7 mb-3 ${color}`} />
                <h3 className="font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-violet-600 to-indigo-700 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 py-20 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to take control of your preparation?
          </h2>
          <p className="text-white/70 mb-8 text-lg">
            Set up your syllabus, build a timetable, and start your first Pomodoro session — all in under 10 minutes.
          </p>
          {session ? (
            <Link to="/" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-white text-primary font-bold hover:bg-white/90 transition-colors text-base shadow-xl">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link to="/auth" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-white text-primary font-bold hover:bg-white/90 transition-colors text-base shadow-xl">
              Create free account <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/preptrack_logo.png" alt="PrepTrack" className="h-4 w-4 rounded-sm" />
          <span className="font-semibold text-foreground">PrepTrack</span>
        </div>
        <div className="flex items-center justify-center gap-4">
          <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
          <Link to="/guide" className="hover:text-foreground transition-colors">User Guide</Link>
          {session
            ? <Link to="/" className="hover:text-foreground transition-colors">Dashboard</Link>
            : <Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link>
          }
        </div>
      </footer>
    </div>
  )
}
