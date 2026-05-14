import { useState, useEffect } from 'react'
import { Lock, CheckCircle2, Trophy, Star, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { cn } from '../lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeCategory = 'All' | 'Pomodoro' | 'Syllabus' | 'Tests' | 'Knowledge' | 'Practice'

interface Badge {
  id: string
  name: string
  icon: string
  description: string
  category: Exclude<BadgeCategory, 'All'>
  unlocked: boolean
  progress: number // 0-100
}

// ─── Fetched stats shape ───────────────────────────────────────────────────────

interface Stats {
  focusCount: number
  completedTopics: number
  totalTopics: number
  testCount: number
  noteCount: number
  resolvedDoubts: number
  caCount: number
  goalsCompleted: number
  maxScore: number
}

// ─── Badge builder ────────────────────────────────────────────────────────────

function buildBadges(s: Stats): Badge[] {
  const sylPct = s.totalTopics > 0 ? (s.completedTopics / s.totalTopics) * 100 : 0

  return [
    // Pomodoro
    {
      id: 'first-tomato',
      name: 'First Tomato',
      icon: '🍅',
      description: 'Complete your very first focus session.',
      category: 'Pomodoro',
      unlocked: s.focusCount >= 1,
      progress: Math.min(100, s.focusCount >= 1 ? 100 : 0),
    },
    {
      id: 'focused-mind',
      name: 'Focused Mind',
      icon: '🧠',
      description: 'Complete 25 focus sessions.',
      category: 'Pomodoro',
      unlocked: s.focusCount >= 25,
      progress: Math.min(100, Math.round((s.focusCount / 25) * 100)),
    },
    {
      id: 'pomodoro-pro',
      name: 'Pomodoro Pro',
      icon: '⏱️',
      description: 'Complete 100 focus sessions.',
      category: 'Pomodoro',
      unlocked: s.focusCount >= 100,
      progress: Math.min(100, Math.round((s.focusCount / 100) * 100)),
    },
    {
      id: 'pomodoro-legend',
      name: 'Pomodoro Legend',
      icon: '🏆',
      description: 'Complete 500 focus sessions.',
      category: 'Pomodoro',
      unlocked: s.focusCount >= 500,
      progress: Math.min(100, Math.round((s.focusCount / 500) * 100)),
    },

    // Syllabus
    {
      id: 'first-step',
      name: 'First Step',
      icon: '👣',
      description: 'Complete your first syllabus topic.',
      category: 'Syllabus',
      unlocked: s.completedTopics >= 1,
      progress: Math.min(100, s.completedTopics >= 1 ? 100 : 0),
    },
    {
      id: 'quarter-done',
      name: 'Quarter Done',
      icon: '📗',
      description: 'Complete 25% of the syllabus.',
      category: 'Syllabus',
      unlocked: sylPct >= 25,
      progress: Math.min(100, Math.round((sylPct / 25) * 100)),
    },
    {
      id: 'halfway-there',
      name: 'Halfway There',
      icon: '📘',
      description: 'Complete 50% of the syllabus.',
      category: 'Syllabus',
      unlocked: sylPct >= 50,
      progress: Math.min(100, Math.round((sylPct / 50) * 100)),
    },
    {
      id: 'syllabus-champion',
      name: 'Syllabus Champion',
      icon: '🎓',
      description: 'Complete 100% of the syllabus.',
      category: 'Syllabus',
      unlocked: sylPct >= 100,
      progress: Math.min(100, Math.round(sylPct)),
    },

    // Tests
    {
      id: 'first-test',
      name: 'First Test',
      icon: '📝',
      description: 'Log your first test result.',
      category: 'Tests',
      unlocked: s.testCount >= 1,
      progress: Math.min(100, s.testCount >= 1 ? 100 : 0),
    },
    {
      id: 'test-regular',
      name: 'Test Regular',
      icon: '📋',
      description: 'Log 10 test results.',
      category: 'Tests',
      unlocked: s.testCount >= 10,
      progress: Math.min(100, Math.round((s.testCount / 10) * 100)),
    },
    {
      id: 'test-master',
      name: 'Test Master',
      icon: '🎯',
      description: 'Log 50 test results.',
      category: 'Tests',
      unlocked: s.testCount >= 50,
      progress: Math.min(100, Math.round((s.testCount / 50) * 100)),
    },
    {
      id: 'high-scorer',
      name: 'High Scorer',
      icon: '💯',
      description: 'Score 90% or above on any test.',
      category: 'Tests',
      unlocked: s.maxScore >= 90,
      progress: Math.min(100, Math.round((s.maxScore / 90) * 100)),
    },

    // Knowledge
    {
      id: 'note-taker',
      name: 'Note Taker',
      icon: '📓',
      description: 'Create 5 notes.',
      category: 'Knowledge',
      unlocked: s.noteCount >= 5,
      progress: Math.min(100, Math.round((s.noteCount / 5) * 100)),
    },
    {
      id: 'scholar',
      name: 'Scholar',
      icon: '📚',
      description: 'Create 25 notes.',
      category: 'Knowledge',
      unlocked: s.noteCount >= 25,
      progress: Math.min(100, Math.round((s.noteCount / 25) * 100)),
    },
    {
      id: 'daily-reader',
      name: 'Daily Reader',
      icon: '📰',
      description: 'Log 10 current affairs entries.',
      category: 'Knowledge',
      unlocked: s.caCount >= 10,
      progress: Math.min(100, Math.round((s.caCount / 10) * 100)),
    },
    {
      id: 'news-expert',
      name: 'News Expert',
      icon: '🌐',
      description: 'Log 50 current affairs entries.',
      category: 'Knowledge',
      unlocked: s.caCount >= 50,
      progress: Math.min(100, Math.round((s.caCount / 50) * 100)),
    },

    // Practice
    {
      id: 'doubt-buster',
      name: 'Doubt Buster',
      icon: '💡',
      description: 'Resolve 5 doubts.',
      category: 'Practice',
      unlocked: s.resolvedDoubts >= 5,
      progress: Math.min(100, Math.round((s.resolvedDoubts / 5) * 100)),
    },
    {
      id: 'goal-achiever',
      name: 'Goal Achiever',
      icon: '🚀',
      description: 'Complete 3 goals.',
      category: 'Practice',
      unlocked: s.goalsCompleted >= 3,
      progress: Math.min(100, Math.round((s.goalsCompleted / 3) * 100)),
    },
  ]
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-amber-400 transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

// ─── Badge Card ───────────────────────────────────────────────────────────────

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <div
      className={cn(
        'relative border rounded-lg p-4 flex flex-col gap-2 transition-all',
        badge.unlocked
          ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
          : 'border-border bg-card opacity-70',
      )}
    >
      {/* Lock overlay */}
      {!badge.unlocked && (
        <div className="absolute top-2 right-2 text-muted-foreground/50">
          <Lock className="h-3.5 w-3.5" />
        </div>
      )}

      {/* Unlocked checkmark */}
      {badge.unlocked && (
        <div className="absolute top-2 right-2 text-amber-500">
          <CheckCircle2 className="h-3.5 w-3.5" />
        </div>
      )}

      {/* Icon */}
      <span
        className={cn('text-3xl leading-none', !badge.unlocked && 'grayscale')}
        role="img"
        aria-label={badge.name}
      >
        {badge.icon}
      </span>

      {/* Name & description */}
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground leading-tight">{badge.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{badge.description}</p>
      </div>

      {/* Footer */}
      {badge.unlocked ? (
        <p className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Unlocked!
        </p>
      ) : (
        <div className="space-y-1">
          <ProgressBar value={badge.progress} />
          <p className="text-xs text-muted-foreground text-right">{badge.progress}%</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const CATEGORIES: BadgeCategory[] = ['All', 'Pomodoro', 'Syllabus', 'Tests', 'Knowledge', 'Practice']

const EMPTY_STATS: Stats = {
  focusCount: 0,
  completedTopics: 0,
  totalTopics: 0,
  testCount: 0,
  noteCount: 0,
  resolvedDoubts: 0,
  caCount: 0,
  goalsCompleted: 0,
  maxScore: 0,
}

export function AchievementsPage() {
  const { session } = useAuthStore()
  const [stats, setStats] = useState<Stats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<BadgeCategory>('All')

  useEffect(() => {
    if (session) fetchStats()
  }, [session])

  async function fetchStats() {
    setLoading(true)
    const userId = session!.user.id

    const [
      { count: focusCount },
      { count: completedTopics },
      { count: totalTopics },
      { count: testCount },
      { count: noteCount },
      { count: resolvedDoubts },
      { count: caCount },
      { count: goalsCompleted },
      { data: tests },
    ] = await Promise.all([
      supabase
        .from('study_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('session_type', 'focus')
        .not('duration_minutes', 'is', null),

      supabase
        .from('user_syllabus_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed'),

      supabase
        .from('syllabus_nodes')
        .select('*', { count: 'exact', head: true })
        .eq('is_leaf', true),

      supabase
        .from('tests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),

      supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),

      supabase
        .from('doubts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'resolved'),

      supabase
        .from('ca_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),

      supabase
        .from('goals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed'),

      supabase
        .from('tests')
        .select('scored_marks,total_marks')
        .eq('user_id', userId),
    ])

    const maxScore = tests
      ? Math.max(...tests.map((t) => (t.total_marks > 0 ? (t.scored_marks / t.total_marks) * 100 : 0)), 0)
      : 0

    setStats({
      focusCount: focusCount ?? 0,
      completedTopics: completedTopics ?? 0,
      totalTopics: totalTopics ?? 0,
      testCount: testCount ?? 0,
      noteCount: noteCount ?? 0,
      resolvedDoubts: resolvedDoubts ?? 0,
      caCount: caCount ?? 0,
      goalsCompleted: goalsCompleted ?? 0,
      maxScore,
    })
    setLoading(false)
  }

  const badges = buildBadges(stats)
  const unlockedCount = badges.filter((b) => b.unlocked).length
  const totalCount = badges.length
  const completionPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0
  const totalXP = unlockedCount * 10

  const filtered =
    activeCategory === 'All' ? badges : badges.filter((b) => b.category === activeCategory)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-foreground">Achievements</h1>
          <p className="text-xs text-muted-foreground">
            {unlockedCount} / {totalCount} unlocked
          </p>
        </div>
        <Trophy className="h-6 w-6 text-amber-500" />
      </div>

      {/* Stats summary row */}
      <div className="grid grid-cols-3 gap-3 px-4 py-3 border-b border-border bg-muted/20 flex-shrink-0">
        <div className="border border-border rounded-lg bg-card p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="h-4 w-4 text-amber-500" />
            <p className="text-xl font-bold text-foreground">{totalXP}</p>
          </div>
          <p className="text-xs text-muted-foreground">Total XP</p>
        </div>
        <div className="border border-border rounded-lg bg-card p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star className="h-4 w-4 text-amber-500" />
            <p className="text-xl font-bold text-foreground">{unlockedCount}</p>
          </div>
          <p className="text-xs text-muted-foreground">Badges Earned</p>
        </div>
        <div className="border border-border rounded-lg bg-card p-4 text-center">
          <p className="text-xl font-bold text-primary mb-1">{completionPct}%</p>
          <p className="text-xs text-muted-foreground">Completion</p>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-1 px-4 py-2 border-b border-border overflow-x-auto flex-shrink-0 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
              activeCategory === cat
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Badge grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-36 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Trophy className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">No badges in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
