import { useState, useEffect } from 'react'
import { Plus, CalendarCheck2, ExternalLink, X, Flag, Bell } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'
import { format, differenceInDays, isPast, isToday } from 'date-fns'
import { cn } from '../lib/utils'

interface ExamDate {
  id: string
  exam_name: string
  event_type: 'notification' | 'registration' | 'admit_card' | 'exam' | 'result' | 'interview' | 'other'
  event_date: string
  description: string | null
  url: string | null
  is_done: boolean
  remind_days: number
}

const TYPE_CONFIG = {
  notification: { label: 'Notification',  color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400' },
  registration: { label: 'Registration',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'         },
  admit_card:   { label: 'Admit Card',    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400'         },
  exam:         { label: 'Exam Day',      color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'             },
  result:       { label: 'Result',        color: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'     },
  interview:    { label: 'Interview',     color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' },
  other:        { label: 'Other',         color: 'bg-muted text-muted-foreground'                                            },
}

function countdownChip(dateStr: string, isDone: boolean) {
  if (isDone) return { text: 'Done', cls: 'bg-muted text-muted-foreground' }
  const d   = new Date(dateStr)
  const diff = differenceInDays(d, new Date())
  if (isPast(d) && !isToday(d)) return { text: 'Passed', cls: 'bg-muted text-muted-foreground' }
  if (isToday(d))  return { text: 'Today!', cls: 'bg-red-500 text-white animate-pulse' }
  if (diff <= 3)   return { text: `${diff}d left`, cls: 'bg-red-500 text-white' }
  if (diff <= 7)   return { text: `${diff}d left`, cls: 'bg-orange-500 text-white' }
  if (diff <= 30)  return { text: `${diff}d left`, cls: 'bg-amber-500 text-white' }
  return { text: `${diff}d left`, cls: 'bg-muted text-muted-foreground' }
}

const EMPTY_FORM = {
  exam_name: '', event_type: 'exam' as ExamDate['event_type'],
  event_date: '', description: '', url: '', remind_days: 7,
}

export function ExamCalendarPage() {
  const { session } = useAuthStore()
  const [dates, setDates]     = useState<ExamDate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ExamDate | null>(null)
  const [form, setForm]       = useState(EMPTY_FORM)
  const [filter, setFilter]   = useState<'upcoming' | 'all' | 'done'>('upcoming')

  useEffect(() => { if (session) fetchDates() }, [session])

  async function fetchDates() {
    setLoading(true)
    const { data } = await supabase
      .from('exam_dates')
      .select('*')
      .eq('user_id', session!.user.id)
      .order('event_date', { ascending: true })
    setDates(data ?? [])
    setLoading(false)
  }

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(d: ExamDate) {
    setEditing(d)
    setForm({
      exam_name: d.exam_name, event_type: d.event_type,
      event_date: d.event_date, description: d.description ?? '',
      url: d.url ?? '', remind_days: d.remind_days,
    })
    setShowForm(true)
  }

  async function save() {
    if (!form.exam_name.trim() || !form.event_date) {
      toast.error('Exam name and date are required')
      return
    }
    if (editing) {
      const { error } = await supabase.from('exam_dates').update({
        ...form, remind_days: Number(form.remind_days),
        description: form.description || null, url: form.url || null,
      }).eq('id', editing.id)
      if (error) { toast.error('Failed to update'); return }
      toast.success('Updated')
    } else {
      const { error } = await supabase.from('exam_dates').insert({
        user_id: session!.user.id, ...form,
        remind_days: Number(form.remind_days),
        description: form.description || null, url: form.url || null,
      })
      if (error) { toast.error('Failed to save'); return }
      toast.success('Date added')
    }
    setShowForm(false)
    fetchDates()
  }

  async function toggleDone(d: ExamDate) {
    await supabase.from('exam_dates').update({ is_done: !d.is_done }).eq('id', d.id)
    fetchDates()
  }

  async function deleteDate(id: string) {
    await supabase.from('exam_dates').delete().eq('id', id)
    toast.success('Deleted')
    fetchDates()
  }

  const filtered = dates.filter(d => {
    if (filter === 'done')     return d.is_done
    if (filter === 'upcoming') return !d.is_done && !isPast(new Date(d.event_date))
    return true
  })

  // Group by exam name
  const grouped = filtered.reduce<Record<string, ExamDate[]>>((acc, d) => {
    acc[d.exam_name] = [...(acc[d.exam_name] ?? []), d]
    return acc
  }, {})

  const upcoming7 = dates.filter(d => {
    const diff = differenceInDays(new Date(d.event_date), new Date())
    return !d.is_done && diff >= 0 && diff <= 7
  })

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h1 className="text-lg font-bold text-foreground">Exam Calendar</h1>
          <p className="text-xs text-muted-foreground">
            {dates.filter(d => !d.is_done).length} upcoming events
            {upcoming7.length > 0 && <span className="text-red-500 font-medium"> · {upcoming7.length} within 7 days!</span>}
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Add Date
        </button>
      </div>

      {/* Alert strip for very close dates */}
      {upcoming7.length > 0 && (
        <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          <Bell className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong>{upcoming7[0].exam_name}</strong> — {upcoming7[0].event_type.replace('_',' ')} is on{' '}
            <strong>{format(new Date(upcoming7[0].event_date), 'd MMM yyyy')}</strong>
          </span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Filter */}
          <div className="flex gap-1">
            {(['upcoming','all','done'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize',
                  filter === f ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                )}>
                {f === 'upcoming' ? 'Upcoming' : f === 'all' ? 'All Events' : 'Completed'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <CalendarCheck2 className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">No exam dates tracked yet</p>
              <p className="text-xs mt-1">Add important dates like registration, admit card, exam day, and result</p>
              <button onClick={openAdd}
                className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                Add your first date
              </button>
            </div>
          ) : (
            Object.entries(grouped).map(([examName, events]) => (
              <div key={examName} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      <Flag className="h-4 w-4 text-primary" />
                      {examName}
                    </h3>
                    <span className="text-xs text-muted-foreground">{events.length} event{events.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {events.map(ev => {
                    const chip = countdownChip(ev.event_date, ev.is_done)
                    return (
                      <div key={ev.id} className={cn('px-4 py-3 flex items-start gap-3', ev.is_done && 'opacity-50')}>
                        <input type="checkbox" checked={ev.is_done} onChange={() => toggleDone(ev)}
                          className="mt-0.5 h-4 w-4 rounded accent-primary cursor-pointer" />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', TYPE_CONFIG[ev.event_type].color)}>
                              {TYPE_CONFIG[ev.event_type].label}
                            </span>
                            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', chip.cls)}>
                              {chip.text}
                            </span>
                          </div>
                          <p className={cn('text-sm font-medium text-foreground', ev.is_done && 'line-through')}>
                            {format(new Date(ev.event_date), 'EEEE, d MMMM yyyy')}
                          </p>
                          {ev.description && <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {ev.url && (
                            <a href={ev.url} target="_blank" rel="noreferrer"
                              className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button onClick={() => openEdit(ev)}
                            className="p-1.5 rounded hover:bg-muted transition-colors text-xs text-muted-foreground hover:text-foreground">
                            Edit
                          </button>
                          <button onClick={() => deleteDate(ev.id)}
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-muted-foreground hover:text-red-500">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Form panel */}
        {showForm && (
          <div className="w-80 flex-shrink-0 border-l border-border overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">{editing ? 'Edit Date' : 'Add New Date'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Exam Name *</label>
              <input value={form.exam_name} onChange={e => setForm(p => ({ ...p, exam_name: e.target.value }))}
                placeholder="e.g. UPSC CSE 2025, GATE CS 2025"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Event Type *</label>
              <select value={form.event_type} onChange={e => setForm(p => ({ ...p, event_type: e.target.value as ExamDate['event_type'] }))}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="notification">Notification Released</option>
                <option value="registration">Registration Opens</option>
                <option value="admit_card">Admit Card</option>
                <option value="exam">Exam Day</option>
                <option value="result">Result</option>
                <option value="interview">Interview / Personality Test</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date *</label>
              <input type="date" value={form.event_date} onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="e.g. Online mode only, Last date for fee payment"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Official Link (optional)</label>
              <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                placeholder="https://..."
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={save}
                className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                {editing ? 'Update' : 'Add Date'}
              </button>
              <button onClick={() => setShowForm(false)}
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
