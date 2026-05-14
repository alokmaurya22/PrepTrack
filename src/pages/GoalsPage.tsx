import { useState, useEffect } from 'react'
import { Plus, Target, TrendingUp, CheckCircle2, X, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { cn } from '../lib/utils'

interface Goal {
  id: string
  title: string
  type: 'study_hours' | 'topics' | 'tests' | 'revision' | 'pages' | 'custom'
  period: 'daily' | 'weekly' | 'monthly' | 'custom'
  target_value: number
  current_value: number
  unit: string
  start_date: string
  end_date: string
  status: 'active' | 'completed' | 'abandoned'
  color: string
}

const TYPE_ICONS: Record<Goal['type'], string> = {
  study_hours: '⏱',
  topics: '📚',
  tests: '📝',
  revision: '🔄',
  pages: '📖',
  custom: '🎯',
}

const PERIOD_COLORS: Record<string, string> = {
  daily:   'bg-violet-50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-800',
  weekly:  'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
  monthly: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800',
  custom:  'bg-muted border-border',
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

const DEFAULT_FORM = {
  title: '', type: 'study_hours' as Goal['type'],
  period: 'weekly' as Goal['period'],
  target_value: 40, current_value: 0, unit: 'hours',
  start_date: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  end_date:   format(endOfWeek(new Date(),   { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  color: '#6366f1',
}

const TYPE_UNITS: Record<Goal['type'], string> = {
  study_hours: 'hours',
  topics: 'topics',
  tests: 'tests',
  revision: 'sessions',
  pages: 'pages',
  custom: 'units',
}

export function GoalsPage() {
  const { session }  = useAuthStore()
  const [goals, setGoals]   = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [newVal, setNewVal] = useState('')
  const [form, setForm]     = useState(DEFAULT_FORM)
  const [tab, setTab]       = useState<'active' | 'completed' | 'all'>('active')

  useEffect(() => { if (session) fetchGoals() }, [session])

  async function fetchGoals() {
    setLoading(true)
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', session!.user.id)
      .order('created_at', { ascending: false })
    setGoals(data ?? [])
    setLoading(false)
  }

  function onTypeChange(type: Goal['type']) {
    setForm(p => ({ ...p, type, unit: TYPE_UNITS[type] }))
  }

  function onPeriodChange(period: Goal['period']) {
    const now = new Date()
    let start = format(now, 'yyyy-MM-dd')
    let end   = format(now, 'yyyy-MM-dd')
    if (period === 'weekly') {
      start = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      end   = format(endOfWeek(now,   { weekStartsOn: 1 }), 'yyyy-MM-dd')
    } else if (period === 'monthly') {
      start = format(startOfMonth(now), 'yyyy-MM-dd')
      end   = format(endOfMonth(now),   'yyyy-MM-dd')
    }
    setForm(p => ({ ...p, period, start_date: start, end_date: end }))
  }

  async function saveGoal() {
    if (!form.title.trim()) { toast.error('Title required'); return }
    if (editingId) {
      const { error } = await supabase.from('goals').update({
        title: form.title, type: form.type, period: form.period,
        target_value: Number(form.target_value), unit: form.unit,
        start_date: form.start_date, end_date: form.end_date, color: form.color,
      }).eq('id', editingId)
      if (error) { toast.error('Failed to update'); return }
      toast.success('Goal updated')
    } else {
      const { error } = await supabase.from('goals').insert({
        user_id: session!.user.id, ...form,
        target_value: Number(form.target_value),
        current_value: Number(form.current_value),
      })
      if (error) { toast.error('Failed to create goal'); return }
      toast.success('Goal created!')
    }
    setShowForm(false)
    setEditingId(null)
    setForm(DEFAULT_FORM)
    fetchGoals()
  }

  async function updateProgress(goal: Goal) {
    const val = parseFloat(newVal)
    if (isNaN(val)) { toast.error('Enter a valid number'); return }
    const newCurrent = Math.max(0, val)
    const isCompleted = newCurrent >= goal.target_value
    const { error } = await supabase.from('goals').update({
      current_value: newCurrent,
      status: isCompleted ? 'completed' : 'active',
    }).eq('id', goal.id)
    if (error) { toast.error('Failed to update'); return }
    if (isCompleted) toast.success('🎉 Goal completed!')
    else toast.success('Progress updated')
    setUpdatingId(null)
    setNewVal('')
    fetchGoals()
  }

  async function archiveGoal(id: string) {
    await supabase.from('goals').update({ status: 'abandoned' }).eq('id', id)
    toast.success('Goal archived')
    fetchGoals()
  }

  async function deleteGoal(id: string) {
    await supabase.from('goals').delete().eq('id', id)
    toast.success('Deleted')
    fetchGoals()
  }

  function openEdit(g: Goal) {
    setEditingId(g.id)
    setForm({
      title: g.title, type: g.type, period: g.period,
      target_value: g.target_value, current_value: g.current_value,
      unit: g.unit, start_date: g.start_date, end_date: g.end_date, color: g.color,
    })
    setShowForm(true)
  }

  const filtered = goals.filter(g =>
    tab === 'all' ? true :
    tab === 'active' ? g.status === 'active' :
    g.status === 'completed'
  )

  const stats = {
    active:    goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    totalPct:  goals.length === 0 ? 0 : Math.round(
      goals.filter(g => g.status === 'active').reduce((a, g) =>
        a + Math.min(1, g.target_value === 0 ? 0 : g.current_value / g.target_value), 0
      ) / Math.max(1, goals.filter(g => g.status === 'active').length) * 100
    ),
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h1 className="text-lg font-bold text-foreground">Goals</h1>
          <p className="text-xs text-muted-foreground">{stats.active} active · {stats.completed} completed</p>
        </div>
        <button onClick={() => { setEditingId(null); setForm(DEFAULT_FORM); setShowForm(true) }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> New Goal
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 px-4 py-3 border-b border-border bg-muted/20">
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">{stats.active}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-primary">{stats.totalPct}%</p>
          <p className="text-xs text-muted-foreground">Avg Progress</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Goals list */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Tabs */}
          <div className="flex gap-1 mb-4">
            {(['active','completed','all'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize',
                  tab === t ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                )}>
                {t === 'all' ? 'All Goals' : t}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-36 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Target className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">No goals yet</p>
              <p className="text-xs mt-1">Set daily, weekly or monthly goals to stay on track</p>
              <button onClick={() => { setEditingId(null); setForm(DEFAULT_FORM); setShowForm(true) }}
                className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                Create your first goal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(goal => {
                const pct = goal.target_value === 0 ? 0 : Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
                const isCompleted = goal.status === 'completed'
                return (
                  <div key={goal.id}
                    className={cn('border rounded-xl p-4 space-y-3 relative', PERIOD_COLORS[goal.period])}>
                    {isCompleted && (
                      <div className="absolute top-2 right-2">
                        <Trophy className="h-4 w-4 text-amber-500" />
                      </div>
                    )}
                    <div className="flex items-start gap-2 pr-6">
                      <span className="text-lg">{TYPE_ICONS[goal.type]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground line-clamp-2">{goal.title}</p>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">
                          {goal.period} · {format(new Date(goal.start_date), 'd MMM')} – {format(new Date(goal.end_date), 'd MMM')}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-end justify-between mb-1">
                        <span className="text-xs text-muted-foreground">
                          {goal.current_value} / {goal.target_value} {goal.unit}
                        </span>
                        <span className={cn('text-xs font-bold', pct >= 100 ? 'text-green-600' : 'text-foreground')}>
                          {pct}%
                        </span>
                      </div>
                      <ProgressBar value={goal.current_value} max={goal.target_value} color={goal.color} />
                    </div>

                    {/* Update progress inline */}
                    {!isCompleted && updatingId === goal.id ? (
                      <div className="flex gap-1.5">
                        <input
                          type="number" value={newVal} onChange={e => setNewVal(e.target.value)}
                          placeholder={`Current ${goal.unit}`}
                          className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                          autoFocus
                        />
                        <button onClick={() => updateProgress(goal)}
                          className="px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs hover:bg-primary/90 transition-colors">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setUpdatingId(null)}
                          className="px-2 py-1 rounded-md border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : !isCompleted ? (
                      <div className="flex gap-1.5">
                        <button onClick={() => { setUpdatingId(goal.id); setNewVal(String(goal.current_value)) }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-background border border-border text-xs text-foreground hover:bg-muted transition-colors">
                          <TrendingUp className="h-3 w-3" /> Update
                        </button>
                        <button onClick={() => openEdit(goal)}
                          className="px-2.5 py-1 rounded-md text-xs text-muted-foreground hover:bg-background/60 transition-colors">
                          Edit
                        </button>
                        <button onClick={() => archiveGoal(goal.id)}
                          className="ml-auto px-2.5 py-1 rounded-md text-xs text-muted-foreground hover:text-red-500 transition-colors">
                          Archive
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Achieved!
                        </span>
                        <button onClick={() => deleteGoal(goal.id)}
                          className="ml-auto px-2.5 py-1 rounded-md text-xs text-muted-foreground hover:text-red-500 transition-colors">
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Form panel */}
        {showForm && (
          <div className="w-80 flex-shrink-0 border-l border-border overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-foreground">{editingId ? 'Edit Goal' : 'New Goal'}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Study 40 hours this week"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <select value={form.type} onChange={e => onTypeChange(e.target.value as Goal['type'])}
                  className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="study_hours">Study Hours</option>
                  <option value="topics">Topics</option>
                  <option value="tests">Tests</option>
                  <option value="revision">Revision</option>
                  <option value="pages">Pages</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Period</label>
                <select value={form.period} onChange={e => onPeriodChange(e.target.value as Goal['period'])}
                  className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Target</label>
                <input type="number" value={form.target_value} onChange={e => setForm(p => ({ ...p, target_value: parseFloat(e.target.value) || 0 }))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Unit</label>
                <input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                  placeholder="hours / topics"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Start</label>
                <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">End</label>
                <input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Color</label>
              <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                className="mt-1 h-8 w-full rounded-md border border-input bg-background cursor-pointer" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={saveGoal}
                className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                {editingId ? 'Update Goal' : 'Create Goal'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingId(null) }}
                className="px-3 py-2 rounded-md border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
