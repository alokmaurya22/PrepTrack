import { useState, useEffect } from 'react'
import { Plus, CheckCircle2, Clock, ChevronDown, Search, X, BookOpen, Lightbulb } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '../lib/utils'

type Status = 'all' | 'pending' | 'resolved' | 'deferred'

interface Doubt {
  id: string
  title: string
  description: string | null
  subject: string | null
  status: 'pending' | 'resolved' | 'deferred'
  resolution_note: string | null
  source: string | null
  created_at: string
  resolved_at: string | null
}

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400'  },
  resolved: { label: 'Resolved', color: 'text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400' },
  deferred: { label: 'Deferred', color: 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400'    },
}

export function DoubtsPage() {
  const { session } = useAuthStore()
  const [doubts, setDoubts]           = useState<Doubt[]>([])
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState<Status>('all')
  const [search, setSearch]           = useState('')
  const [showForm, setShowForm]       = useState(false)
  const [selected, setSelected]       = useState<Doubt | null>(null)
  const [showResolve, setShowResolve] = useState(false)
  const [resNote, setResNote]         = useState('')

  const [form, setForm] = useState({
    title: '', description: '', subject: '', source: 'self',
  })

  useEffect(() => { if (session) fetchDoubts() }, [session, filter])

  async function fetchDoubts() {
    setLoading(true)
    let q = supabase
      .from('doubts')
      .select('*')
      .eq('user_id', session!.user.id)
      .order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setDoubts(data ?? [])
    setLoading(false)
  }

  async function addDoubt() {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    const { error } = await supabase.from('doubts').insert({
      user_id: session!.user.id,
      title: form.title.trim(),
      description: form.description || null,
      subject: form.subject || null,
      source: form.source,
    })
    if (error) { toast.error('Failed to save doubt'); return }
    toast.success('Doubt logged')
    setForm({ title: '', description: '', subject: '', source: 'self' })
    setShowForm(false)
    fetchDoubts()
  }

  async function resolveDoubt() {
    if (!selected) return
    const { error } = await supabase.from('doubts').update({
      status: 'resolved',
      resolution_note: resNote || null,
      resolved_at: new Date().toISOString(),
    }).eq('id', selected.id)
    if (error) { toast.error('Failed to update'); return }
    toast.success('Doubt resolved!')
    setShowResolve(false)
    setResNote('')
    setSelected(null)
    fetchDoubts()
  }

  async function updateStatus(id: string, status: Doubt['status']) {
    await supabase.from('doubts').update({ status }).eq('id', id)
    fetchDoubts()
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
  }

  async function deleteDoubt(id: string) {
    await supabase.from('doubts').delete().eq('id', id)
    toast.success('Deleted')
    setSelected(null)
    fetchDoubts()
  }

  const filtered = doubts.filter(d =>
    search === '' ||
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    (d.subject ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const counts = {
    all: doubts.length,
    pending: doubts.filter(d => d.status === 'pending').length,
    resolved: doubts.filter(d => d.status === 'resolved').length,
    deferred: doubts.filter(d => d.status === 'deferred').length,
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h1 className="text-lg font-bold text-foreground">Doubt Journal</h1>
          <p className="text-xs text-muted-foreground">{counts.pending} pending · {counts.resolved} resolved</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setSelected(null) }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Log Doubt
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: List */}
        <div className="w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-border flex flex-col">
          {/* Filters */}
          <div className="px-3 pt-3 pb-2 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search doubts…"
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted rounded-md border border-transparent focus:border-ring focus:outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {(['all','pending','resolved','deferred'] as Status[]).map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={cn('px-2.5 py-1 rounded-full text-xs font-medium transition-colors capitalize',
                    filter === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  )}>
                  {s === 'all' ? `All (${counts.all})` : `${s} (${counts[s]})`}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Lightbulb className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">No doubts here.</p>
                <p className="text-xs mt-1">Log a doubt to start tracking.</p>
              </div>
            ) : filtered.map(doubt => (
              <button key={doubt.id} onClick={() => setSelected(doubt)}
                className={cn('w-full text-left p-3 hover:bg-muted/50 transition-colors',
                  selected?.id === doubt.id && 'bg-primary/5 border-l-2 border-primary'
                )}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground line-clamp-2 flex-1">{doubt.title}</p>
                  <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0', STATUS_CONFIG[doubt.status].color)}>
                    {STATUS_CONFIG[doubt.status].label}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  {doubt.subject && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />{doubt.subject}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(new Date(doubt.created_at), 'd MMM')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Detail / Form */}
        <div className="flex-1 overflow-y-auto p-6">
          {showForm ? (
            <div className="max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground">Log a New Doubt</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Doubt / Question *</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="What exactly is confusing you?"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Subject / Topic</label>
                  <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                    placeholder="e.g. Polity, Thermodynamics, Data Structures"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Details (optional)</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Add context, what you already tried, page number, etc."
                    rows={3}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Source</label>
                  <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="self">While self-studying</option>
                    <option value="lecture">During lecture / class</option>
                    <option value="book">From a book / notes</option>
                    <option value="test">From a test / question</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={addDoubt}
                    className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    Save Doubt
                  </button>
                  <button onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : selected ? (
            <div className="max-w-lg">
              <div className="flex items-start justify-between mb-4">
                <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', STATUS_CONFIG[selected.status].color)}>
                  {STATUS_CONFIG[selected.status].label}
                </span>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-1">{selected.title}</h2>
              <div className="flex gap-3 text-xs text-muted-foreground mb-4">
                {selected.subject && <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{selected.subject}</span>}
                <span>{format(new Date(selected.created_at), 'd MMM yyyy, h:mm a')}</span>
              </div>
              {selected.description && (
                <div className="bg-muted/50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{selected.description}</p>
                </div>
              )}
              {selected.resolution_note && (
                <div className="border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 rounded-lg p-3 mb-4">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Resolution</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{selected.resolution_note}</p>
                  {selected.resolved_at && (
                    <p className="text-xs text-muted-foreground mt-1">Resolved on {format(new Date(selected.resolved_at), 'd MMM yyyy')}</p>
                  )}
                </div>
              )}

              {/* Resolve panel */}
              {showResolve ? (
                <div className="space-y-2 mt-4">
                  <textarea value={resNote} onChange={e => setResNote(e.target.value)}
                    placeholder="How was this resolved? (optional)"
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                  <div className="flex gap-2">
                    <button onClick={resolveDoubt}
                      className="flex-1 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors">
                      Mark as Resolved
                    </button>
                    <button onClick={() => setShowResolve(false)}
                      className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mt-4">
                  {selected.status !== 'resolved' && (
                    <button onClick={() => setShowResolve(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors">
                      <CheckCircle2 className="h-4 w-4" /> Resolve
                    </button>
                  )}
                  {selected.status === 'pending' && (
                    <button onClick={() => updateStatus(selected.id, 'deferred')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                      <Clock className="h-4 w-4" /> Defer
                    </button>
                  )}
                  {selected.status === 'deferred' && (
                    <button onClick={() => updateStatus(selected.id, 'pending')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                      <ChevronDown className="h-4 w-4 rotate-180" /> Reopen
                    </button>
                  )}
                  <button onClick={() => deleteDoubt(selected.id)}
                    className="ml-auto px-3 py-2 rounded-md text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                    Delete
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Lightbulb className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Select a doubt to view details</p>
              <p className="text-xs mt-1">or log a new one with the button above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
