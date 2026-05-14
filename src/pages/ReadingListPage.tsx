import { useState, useEffect } from 'react'
import { Plus, Search, ExternalLink, X, BookOpen, Play, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'
import { cn } from '../lib/utils'

interface ReadingItem {
  id: string
  title: string
  type: 'book' | 'article' | 'video' | 'pdf' | 'podcast' | 'other'
  url: string | null
  author: string | null
  subject: string | null
  status: 'to_read' | 'reading' | 'completed' | 'dropped'
  priority: 'high' | 'medium' | 'low'
  notes: string | null
  total_pages: number | null
  pages_read: number
  created_at: string
}

// Icon content per type (emoji or lucide element)
const TYPE_ICON_CONTENT: Record<ReadingItem['type'], React.ReactNode> = {
  book:    <BookOpen className="h-3 w-3" />,
  article: <span className="text-[11px]">📄</span>,
  video:   <Play className="h-3 w-3" />,
  pdf:     <span className="text-[11px]">📑</span>,
  podcast: <span className="text-[11px]">🎙</span>,
  other:   <span className="text-[11px]">📌</span>,
}

// Color pill classes per type
const TYPE_PILL_CLASSES: Record<ReadingItem['type'], string> = {
  book:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  article: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  video:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pdf:     'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  podcast: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  other:   'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

const STATUS_STYLES: Record<ReadingItem['status'], string> = {
  to_read:   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  reading:   'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  dropped:   'bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400',
}

const PRIORITY_DOT: Record<ReadingItem['priority'], string> = {
  high:   'bg-red-500',
  medium: 'bg-amber-400',
  low:    'bg-slate-300',
}

// Left border color per status
const STATUS_BORDER: Record<ReadingItem['status'], string> = {
  to_read:   'border-l-slate-400',
  reading:   'border-l-blue-500',
  completed: 'border-l-emerald-500',
  dropped:   'border-l-red-400',
}

const EMPTY_FORM = {
  title: '', type: 'book' as ReadingItem['type'], url: '',
  author: '', subject: '', status: 'to_read' as ReadingItem['status'],
  priority: 'medium' as ReadingItem['priority'],
  notes: '', total_pages: '', pages_read: '0',
}

export function ReadingListPage() {
  const { session }  = useAuthStore()
  const [items, setItems]     = useState<ReadingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState<ReadingItem['status'] | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => { if (session) fetchItems() }, [session])

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase
      .from('reading_list')
      .select('*')
      .eq('user_id', session!.user.id)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })
    setItems(data ?? [])
    setLoading(false)
  }

  async function save() {
    if (!form.title.trim()) { toast.error('Title required'); return }
    const payload = {
      title: form.title.trim(),
      type: form.type,
      url: form.url || null,
      author: form.author || null,
      subject: form.subject || null,
      status: form.status,
      priority: form.priority,
      notes: form.notes || null,
      total_pages: form.total_pages ? parseInt(form.total_pages) : null,
      pages_read: parseInt(form.pages_read) || 0,
    }
    if (editingId) {
      const { error } = await supabase.from('reading_list').update(payload).eq('id', editingId)
      if (error) { toast.error('Failed to update'); return }
      toast.success('Updated')
    } else {
      const { error } = await supabase.from('reading_list').insert({ user_id: session!.user.id, ...payload })
      if (error) { toast.error('Failed to save'); return }
      toast.success('Added to reading list')
    }
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    fetchItems()
  }

  async function setStatus(id: string, status: ReadingItem['status']) {
    await supabase.from('reading_list').update({
      status,
      ...(status === 'reading'   ? { started_at: new Date().toISOString().split('T')[0] } : {}),
      ...(status === 'completed' ? { completed_at: new Date().toISOString().split('T')[0] } : {}),
    }).eq('id', id)
    fetchItems()
    toast.success(status === 'completed' ? '✓ Marked as completed' : 'Status updated')
  }

  async function deleteItem(id: string) {
    await supabase.from('reading_list').delete().eq('id', id)
    toast.success('Removed')
    fetchItems()
  }

  function openEdit(item: ReadingItem) {
    setEditingId(item.id)
    setForm({
      title: item.title, type: item.type, url: item.url ?? '', author: item.author ?? '',
      subject: item.subject ?? '', status: item.status, priority: item.priority,
      notes: item.notes ?? '', total_pages: item.total_pages?.toString() ?? '',
      pages_read: item.pages_read.toString(),
    })
    setShowForm(true)
  }

  const filtered = items.filter(i => {
    const matchStatus = statusFilter === 'all' || i.status === statusFilter
    const matchSearch = search === '' ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      (i.author ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (i.subject ?? '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const counts = {
    all: items.length,
    to_read: items.filter(i => i.status === 'to_read').length,
    reading: items.filter(i => i.status === 'reading').length,
    completed: items.filter(i => i.status === 'completed').length,
    dropped: items.filter(i => i.status === 'dropped').length,
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header — gradient */}
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h1 className="text-lg font-bold text-foreground">Reading List</h1>
          <p className="text-xs text-muted-foreground">
            {counts.reading} reading · {counts.to_read} to read · {counts.completed} done
          </p>
        </div>
        <button onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true) }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-md">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search books, articles, videos…"
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted rounded-md border border-transparent focus:border-ring focus:outline-none text-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {(['all','to_read','reading','completed'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={cn('px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                    statusFilter === s
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  )}>
                  {s === 'all' ? `All (${counts.all})` :
                   s === 'to_read' ? `Queue (${counts.to_read})` :
                   s === 'reading' ? `Reading (${counts.reading})` :
                   `Done (${counts.completed})`}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <BookOpen className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Your reading list is empty</p>
              <p className="text-xs mt-1">Add books, articles, and videos you want to study</p>
              <button onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true) }}
                className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                Add first item
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(item => {
                const progress = item.total_pages && item.total_pages > 0
                  ? Math.round((item.pages_read / item.total_pages) * 100) : null
                return (
                  <div key={item.id}
                    className={cn(
                      'flex items-start gap-3 p-3 bg-card border border-border rounded-xl hover:border-border/80 transition-colors border-l-4',
                      STATUS_BORDER[item.status]
                    )}>
                    {/* Priority dot + type pill */}
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0 pt-0.5">
                      <div className={cn('h-2.5 w-2.5 rounded-full', PRIORITY_DOT[item.priority])} />
                      <span className={cn(
                        'inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                        TYPE_PILL_CLASSES[item.type]
                      )}>
                        {TYPE_ICON_CONTENT[item.type]}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0', STATUS_STYLES[item.status])}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 mt-0.5">
                        {item.author  && <span className="text-xs text-muted-foreground">{item.author}</span>}
                        {item.subject && <span className="text-xs text-muted-foreground">{item.subject}</span>}
                      </div>
                      {/* Progress bar for books with pages */}
                      {progress !== null && item.status === 'reading' && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">{progress}%</span>
                        </div>
                      )}
                      {item.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.notes}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noreferrer"
                          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {item.status === 'to_read' && (
                        <button onClick={() => setStatus(item.id, 'reading')}
                          className="px-2 py-1 rounded text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors font-medium">
                          Start
                        </button>
                      )}
                      {item.status === 'reading' && (
                        <button onClick={() => setStatus(item.id, 'completed')}
                          className="p-1.5 rounded text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors">
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => openEdit(item)}
                        className="px-2 py-1 rounded text-xs text-muted-foreground hover:bg-muted transition-colors">
                        Edit
                      </button>
                      <button onClick={() => deleteItem(item.id)}
                        className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="w-80 flex-shrink-0 border-l border-border overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-foreground">{editingId ? 'Edit Item' : 'Add to List'}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Book/article/video title"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as ReadingItem['type'] }))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="book">Book</option>
                  <option value="article">Article</option>
                  <option value="video">Video</option>
                  <option value="pdf">PDF</option>
                  <option value="podcast">Podcast</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as ReadingItem['priority'] }))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Author / Creator</label>
              <input value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))}
                placeholder="Author or channel name"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Subject</label>
              <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                placeholder="e.g. Polity, Maths"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            {(form.type === 'book' || form.type === 'pdf') && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Total Pages</label>
                  <input type="number" value={form.total_pages} onChange={e => setForm(p => ({ ...p, total_pages: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Pages Read</label>
                  <input type="number" value={form.pages_read} onChange={e => setForm(p => ({ ...p, pages_read: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Link (optional)</label>
              <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                placeholder="https://..."
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={2} placeholder="Why you want to read this, key chapters, etc."
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={save}
                className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                {editingId ? 'Update' : 'Add to List'}
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
