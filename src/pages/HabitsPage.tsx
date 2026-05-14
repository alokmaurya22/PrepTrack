import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Check, Flame, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'
import { cn } from '../lib/utils'
import {
  format,
  subDays,
  parseISO,
  differenceInCalendarDays,
  isSameDay,
} from 'date-fns'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Habit {
  id: string
  user_id: string
  name: string
  description: string | null
  icon: string
  color: string
  is_active: boolean
  sort_order: number
  created_at: string
}

interface HabitLog {
  id: string
  user_id: string
  habit_id: string
  date: string // 'yyyy-MM-dd'
  created_at: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Purple', value: '#a855f7' },
]

const DEFAULT_FORM = {
  name: '',
  description: '',
  icon: '✓',
  color: '#6366f1',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLast7Days(): Date[] {
  const days: Date[] = []
  for (let i = 6; i >= 0; i--) {
    days.push(subDays(new Date(), i))
  }
  return days
}

function getStreak(habitId: string, logs: HabitLog[]): number {
  const habitLogs = logs
    .filter((l) => l.habit_id === habitId)
    .map((l) => l.date)
    .sort((a, b) => b.localeCompare(a)) // descending

  if (habitLogs.length === 0) return 0

  const today = format(new Date(), 'yyyy-MM-dd')
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

  // Streak must include today or yesterday
  if (habitLogs[0] !== today && habitLogs[0] !== yesterday) return 0

  let streak = 1
  for (let i = 1; i < habitLogs.length; i++) {
    const prev = parseISO(habitLogs[i - 1])
    const curr = parseISO(habitLogs[i])
    if (differenceInCalendarDays(prev, curr) === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function isDoneOnDate(habitId: string, date: Date, logs: HabitLog[]): boolean {
  const dateStr = format(date, 'yyyy-MM-dd')
  return logs.some((l) => l.habit_id === habitId && l.date === dateStr)
}

// ── Add Habit Form ────────────────────────────────────────────────────────────

interface AddHabitFormProps {
  onClose: () => void
  onCreated: () => void
  userId: string
}

function AddHabitForm({ onClose, onCreated, userId }: AddHabitFormProps) {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Habit name is required')
      return
    }
    setSaving(true)

    const { error } = await supabase.from('habits').insert({
      user_id: userId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      icon: form.icon || '✓',
      color: form.color,
      is_active: true,
      sort_order: Date.now(),
    })

    setSaving(false)

    if (error) {
      toast.error('Failed to create habit')
      return
    }
    toast.success('Habit created!')
    onCreated()
    onClose()
  }

  return (
    <div className="border border-border rounded-lg bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">New Habit</p>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Read for 30 minutes"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Description <span className="text-muted-foreground/60">(optional)</span>
          </label>
          <input
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Short note about this habit"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>

        {/* Icon */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Icon (emoji)</label>
          <input
            value={form.icon}
            onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
            placeholder="✓"
            maxLength={4}
            className="w-20 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>

        {/* Color */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Color</label>
          <div className="flex items-center gap-2">
            {PRESET_COLORS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                title={label}
                onClick={() => setForm((p) => ({ ...p, color: value }))}
                className={cn(
                  'h-6 w-6 rounded-full border-2 transition-transform',
                  form.color === value
                    ? 'border-foreground scale-110'
                    : 'border-transparent hover:scale-105'
                )}
                style={{ backgroundColor: value }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Add Habit'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function HabitsPage() {
  const { session } = useAuthStore()
  const userId = session?.user.id

  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  const today = format(new Date(), 'yyyy-MM-dd')
  const last7Days = getLast7Days()

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const since = format(subDays(new Date(), 14), 'yyyy-MM-dd')

    const [{ data: habitsData, error: habitsErr }, { data: logsData, error: logsErr }] =
      await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('habit_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('date', since),
      ])

    if (habitsErr) toast.error('Failed to load habits')
    if (logsErr) toast.error('Failed to load habit logs')

    setHabits((habitsData as Habit[]) ?? [])
    setLogs((logsData as HabitLog[]) ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Toggle log ─────────────────────────────────────────────────────────────

  async function toggleLog(habit: Habit) {
    if (!userId) return
    setToggling(habit.id)

    const done = isDoneOnDate(habit.id, new Date(), logs)

    if (done) {
      // Delete the log for today
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('user_id', userId)
        .eq('habit_id', habit.id)
        .eq('date', today)

      if (error) {
        toast.error('Failed to update')
        setToggling(null)
        return
      }
      setLogs((prev) =>
        prev.filter(
          (l) => !(l.habit_id === habit.id && l.date === today)
        )
      )
    } else {
      // Upsert a log for today
      const { data, error } = await supabase
        .from('habit_logs')
        .upsert(
          { user_id: userId, habit_id: habit.id, date: today },
          { onConflict: 'user_id,habit_id,date' }
        )
        .select()
        .single()

      if (error) {
        toast.error('Failed to update')
        setToggling(null)
        return
      }
      if (data) {
        setLogs((prev) => [...prev.filter((l) => !(l.habit_id === habit.id && l.date === today)), data as HabitLog])
      }
    }

    setToggling(null)
  }

  // ── Delete (soft) ──────────────────────────────────────────────────────────

  async function deleteHabit(id: string) {
    if (!window.confirm('Remove this habit?')) return

    const { error } = await supabase
      .from('habits')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      toast.error('Failed to remove habit')
      return
    }
    toast.success('Habit removed')
    setHabits((prev) => prev.filter((h) => h.id !== id))
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const doneToday = habits.filter((h) => isDoneOnDate(h.id, new Date(), logs)).length
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Habits</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {doneToday}/{habits.length} done today · {format(new Date(), 'EEEE, MMM d')}
          </p>
        </div>
        <button
          onClick={() => setShowForm((p) => !p)}
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add Habit
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground animate-pulse text-sm">Loading…</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4">
            {/* ── LEFT: Today's habits ─────────────────────────────────── */}
            <div className="flex-1 space-y-3">
              {/* Add form (mobile + desktop left column) */}
              {showForm && userId && (
                <AddHabitForm
                  userId={userId}
                  onClose={() => setShowForm(false)}
                  onCreated={fetchData}
                />
              )}

              {/* Date header */}
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  Today — {format(new Date(), 'EEE, MMM d')}
                </p>
              </div>

              {/* Habit cards */}
              {habits.length === 0 ? (
                <div className="border border-border rounded-lg bg-card p-8 flex flex-col items-center gap-3 text-center">
                  <span className="text-4xl">✓</span>
                  <p className="text-sm font-semibold text-foreground">Add your first habit</p>
                  <p className="text-xs text-muted-foreground">
                    Track daily habits to build consistency
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5 mt-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Habit
                  </button>
                </div>
              ) : (
                habits.map((habit) => {
                  const done = isDoneOnDate(habit.id, new Date(), logs)
                  const streak = getStreak(habit.id, logs)
                  const isToggling = toggling === habit.id

                  return (
                    <div
                      key={habit.id}
                      className={cn(
                        'border border-border rounded-lg bg-card p-4 flex items-center gap-3 transition-colors',
                        done && 'bg-muted/40'
                      )}
                    >
                      {/* Colored icon */}
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-lg shrink-0 select-none"
                        style={{ backgroundColor: habit.color + '22', color: habit.color }}
                      >
                        {habit.icon || '✓'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm font-semibold text-foreground',
                            done && 'line-through text-muted-foreground'
                          )}
                        >
                          {habit.name}
                        </p>
                        {habit.description && (
                          <p className="text-xs text-muted-foreground truncate">{habit.description}</p>
                        )}
                        {/* Streak */}
                        {streak > 0 && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Flame className="h-3 w-3 text-orange-500" />
                            <span className="text-xs text-orange-500 font-medium">
                              {streak} day streak
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Checkbox */}
                      <button
                        onClick={() => toggleLog(habit)}
                        disabled={isToggling}
                        title={done ? 'Mark undone' : 'Mark done'}
                        className={cn(
                          'h-7 w-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                          done
                            ? 'border-transparent text-white'
                            : 'border-border hover:border-primary',
                          isToggling && 'opacity-50 cursor-wait'
                        )}
                        style={done ? { backgroundColor: habit.color } : {}}
                      >
                        {done && <Check className="h-4 w-4" />}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        title="Remove habit"
                        className="text-muted-foreground/40 hover:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            {/* ── RIGHT: Last 7 days grid ──────────────────────────────── */}
            {habits.length > 0 && (
              <div className="lg:w-80 shrink-0">
                <div className="border border-border rounded-lg bg-card p-4">
                  <p className="text-sm font-semibold text-foreground mb-3">Last 7 Days</p>

                  {/* Column headers */}
                  <div className="grid mb-1" style={{ gridTemplateColumns: `1fr repeat(7, 2rem)` }}>
                    <div /> {/* habit name spacer */}
                    {last7Days.map((d) => (
                      <div key={d.toISOString()} className="text-center">
                        <p className="text-[10px] text-muted-foreground leading-none">
                          {DAY_LABELS[d.getDay()]}
                        </p>
                        <p
                          className={cn(
                            'text-[10px] font-medium leading-none mt-0.5',
                            isSameDay(d, new Date())
                              ? 'text-primary'
                              : 'text-muted-foreground/60'
                          )}
                        >
                          {format(d, 'd')}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Habit rows */}
                  <div className="space-y-2 mt-2">
                    {habits.map((habit) => (
                      <div
                        key={habit.id}
                        className="grid items-center gap-1"
                        style={{ gridTemplateColumns: `1fr repeat(7, 2rem)` }}
                      >
                        {/* Habit name */}
                        <p className="text-xs text-foreground truncate pr-2 flex items-center gap-1">
                          <span>{habit.icon}</span>
                          <span className="truncate">{habit.name}</span>
                        </p>

                        {/* Day cells */}
                        {last7Days.map((d) => {
                          const done = isDoneOnDate(habit.id, d, logs)
                          const isToday = isSameDay(d, new Date())
                          return (
                            <div key={d.toISOString()} className="flex items-center justify-center">
                              <span
                                className={cn(
                                  'h-5 w-5 rounded-full border-2 inline-block',
                                  done ? 'border-transparent' : 'border-border bg-transparent',
                                  isToday && !done && 'border-primary/40'
                                )}
                                style={done ? { backgroundColor: habit.color } : {}}
                                title={format(d, 'MMM d')}
                              />
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
