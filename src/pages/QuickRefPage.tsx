import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Pin, X, BookMarked, Edit2, Check, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'
import { cn } from '../lib/utils'

interface QuickRef {
  id: string
  title: string
  content: string
  subject: string | null
  tags: string[]
  is_pinned: boolean
  color: string
  created_at: string
  updated_at: string
}

const CARD_COLORS = [
  { bg: '#f8fafc', label: 'Default' },
  { bg: '#fef9ee', label: 'Yellow'  },
  { bg: '#f0fdf4', label: 'Green'   },
  { bg: '#eff6ff', label: 'Blue'    },
  { bg: '#fdf4ff', label: 'Purple'  },
  { bg: '#fff1f2', label: 'Red'     },
]

const EMPTY_FORM = { title: '', content: '', subject: '', tags: '', is_pinned: false, color: '#f8fafc' }

export function QuickRefPage() {
  const { session }  = useAuthStore()
  const [refs, setRefs]       = useState<QuickRef[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [showForm, setShowForm]     = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [expanded, setExpanded]     = useState<string | null>(null)
  const [inlineEdit, setInlineEdit] = useState<{ id: string; field: 'title' | 'content'; val: string } | null>(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Quiz mode state
  const [quizMode, setQuizMode] = useState(false)
  const [quizCards, setQuizCards] = useState<QuickRef[]>([])
  const [quizIndex, setQuizIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [quizStats, setQuizStats] = useState({ known: 0, unknown: 0 })

  useEffect(() => { if (session) fetchRefs() }, [session])

  async function fetchRefs() {
    setLoading(true)
    const { data } = await supabase
      .from('quick_refs')
      .select('*')
      .eq('user_id', session!.user.id)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })
    setRefs(data ?? [])
    setLoading(false)
  }

  async function saveRef() {
    if (!form.title.trim()) { toast.error('Title required'); return }
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      subject: form.subject || null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      is_pinned: form.is_pinned,
      color: form.color,
    }
    if (editingId) {
      const { error } = await supabase.from('quick_refs').update(payload).eq('id', editingId)
      if (error) { toast.error('Failed to update'); return }
      toast.success('Updated')
    } else {
      const { error } = await supabase.from('quick_refs').insert({ user_id: session!.user.id, ...payload })
      if (error) { toast.error('Failed to save'); return }
      toast.success('Card created')
    }
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    fetchRefs()
  }

  async function togglePin(ref: QuickRef) {
    await supabase.from('quick_refs').update({ is_pinned: !ref.is_pinned }).eq('id', ref.id)
    fetchRefs()
  }

  async function deleteRef(id: string) {
    await supabase.from('quick_refs').delete().eq('id', id)
    toast.success('Deleted')
    if (expanded === id) setExpanded(null)
    fetchRefs()
  }

  async function saveInlineEdit() {
    if (!inlineEdit) return
    await supabase.from('quick_refs')
      .update({ [inlineEdit.field]: inlineEdit.val })
      .eq('id', inlineEdit.id)
    setInlineEdit(null)
    fetchRefs()
  }

  function openEdit(ref: QuickRef) {
    setEditingId(ref.id)
    setForm({
      title: ref.title, content: ref.content, subject: ref.subject ?? '',
      tags: ref.tags.join(', '), is_pinned: ref.is_pinned, color: ref.color,
    })
    setShowForm(true)
  }

  function startQuiz() {
    const cards = [...refs].sort(() => Math.random() - 0.5)
    if (cards.length === 0) { toast.error('Add some cards first'); return }
    setQuizCards(cards)
    setQuizIndex(0)
    setShowAnswer(false)
    setQuizStats({ known: 0, unknown: 0 })
    setQuizMode(true)
  }

  const subjects = ['all', ...Array.from(new Set(refs.map(r => r.subject ?? '').filter(Boolean)))]

  const filtered = refs.filter(r => {
    const matchSearch = search === '' ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.content.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchSubject = subjectFilter === 'all' || r.subject === subjectFilter
    return matchSearch && matchSubject
  })

  const pinned   = filtered.filter(r => r.is_pinned)
  const unpinned = filtered.filter(r => !r.is_pinned)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h1 className="text-lg font-bold text-foreground">Quick Reference</h1>
          <p className="text-xs text-muted-foreground">Formulas, key points, fact sheets per topic</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={startQuiz} className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
            <Zap className="h-3.5 w-3.5" /> Quiz
          </button>
          <button onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> New Card
          </button>
        </div>
      </div>

      {/* Quiz mode overlay */}
      {quizMode ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          {quizIndex >= quizCards.length ? (
            // End screen
            <div className="text-center space-y-4 max-w-sm">
              <div className="text-5xl">🎉</div>
              <h2 className="text-xl font-bold text-foreground">Quiz Complete!</h2>
              <div className="flex gap-6 justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-500">{quizStats.known}</div>
                  <div className="text-xs text-muted-foreground">Knew it</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{quizStats.unknown}</div>
                  <div className="text-xs text-muted-foreground">Review needed</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Score: {Math.round((quizStats.known / quizCards.length) * 100)}%
              </div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => { setQuizIndex(0); setShowAnswer(false); setQuizStats({ known: 0, unknown: 0 }) }}
                  className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={() => setQuizMode(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            // Card display
            <div className="w-full max-w-lg space-y-4">
              {/* Progress */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{quizIndex + 1} / {quizCards.length}</span>
                <button onClick={() => setQuizMode(false)} className="text-xs text-muted-foreground hover:text-foreground">Exit Quiz</button>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(quizIndex / quizCards.length) * 100}%` }}
                />
              </div>

              {/* Card */}
              <div
                onClick={() => setShowAnswer(true)}
                className="border border-border rounded-xl p-6 bg-card min-h-[200px] flex flex-col justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                style={{ backgroundColor: quizCards[quizIndex]?.color }}
              >
                <div>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">
                    {showAnswer ? 'Answer' : 'Question — click to reveal'}
                  </p>
                  <h2 className="text-lg font-bold text-foreground">{quizCards[quizIndex]?.title}</h2>
                  {showAnswer && (
                    <pre className="mt-4 text-sm text-foreground font-mono whitespace-pre-wrap leading-relaxed">
                      {quizCards[quizIndex]?.content}
                    </pre>
                  )}
                </div>
                {!showAnswer && (
                  <p className="text-xs text-muted-foreground text-center mt-4">Click to reveal answer</p>
                )}
              </div>

              {/* Buttons — only shown after revealing */}
              {showAnswer && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setQuizStats(s => ({ ...s, unknown: s.unknown + 1 }))
                      setQuizIndex(i => i + 1)
                      setShowAnswer(false)
                    }}
                    className="flex-1 rounded-md bg-red-500/10 text-red-600 border border-red-200 dark:border-red-800 px-4 py-3 text-sm font-medium hover:bg-red-500/20 transition-colors"
                  >
                    ✗ Need Review
                  </button>
                  <button
                    onClick={() => {
                      setQuizStats(s => ({ ...s, known: s.known + 1 }))
                      setQuizIndex(i => i + 1)
                      setShowAnswer(false)
                    }}
                    className="flex-1 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                  >
                    ✓ Knew It
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Main */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Search + filter */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search cards…"
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted rounded-md border border-transparent focus:border-ring focus:outline-none text-foreground placeholder:text-muted-foreground" />
              </div>
              <div className="flex gap-1 flex-wrap">
                {subjects.map(s => (
                  <button key={s} onClick={() => setSubjectFilter(s)}
                    className={cn('px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                      subjectFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
                    )}>
                    {s === 'all' ? 'All' : s}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <BookMarked className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">No reference cards yet</p>
                <p className="text-xs mt-1">Create cards for formulas, key dates, important facts, mnemonics</p>
                <button onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true) }}
                  className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  Create first card
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {pinned.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <Pin className="h-3 w-3" /> Pinned
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {pinned.map(ref => <RefCard key={ref.id} ref_={ref}
                        expanded={expanded} setExpanded={setExpanded}
                        onEdit={openEdit} onDelete={deleteRef} onPin={togglePin}
                        inlineEdit={inlineEdit} setInlineEdit={setInlineEdit}
                        onSaveInline={saveInlineEdit} textareaRef={textareaRef} />)}
                    </div>
                  </>
                )}
                {unpinned.length > 0 && (
                  <>
                    {pinned.length > 0 && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">All Cards</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {unpinned.map(ref => <RefCard key={ref.id} ref_={ref}
                        expanded={expanded} setExpanded={setExpanded}
                        onEdit={openEdit} onDelete={deleteRef} onPin={togglePin}
                        inlineEdit={inlineEdit} setInlineEdit={setInlineEdit}
                        onSaveInline={saveInlineEdit} textareaRef={textareaRef} />)}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Form panel */}
          {showForm && (
            <div className="w-80 flex-shrink-0 border-l border-border overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-foreground">{editingId ? 'Edit Card' : 'New Card'}</h2>
                <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Fundamental Rights, Newton's Laws, Quadratic Formula"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Subject</label>
                <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  placeholder="e.g. Polity, Maths, Physics"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Content</label>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  placeholder="Formulas, key points, mnemonics, important facts…"
                  rows={6}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tags (comma-separated)</label>
                <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                  placeholder="formula, important, chapter-3"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Card Color</label>
                <div className="flex gap-2 mt-1">
                  {CARD_COLORS.map(c => (
                    <button key={c.bg} onClick={() => setForm(p => ({ ...p, color: c.bg }))}
                      className={cn('h-6 w-6 rounded-full border-2 transition-transform hover:scale-110',
                        form.color === c.bg ? 'border-primary scale-110' : 'border-border'
                      )}
                      style={{ backgroundColor: c.bg }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(p => ({ ...p, is_pinned: e.target.checked }))}
                  className="rounded accent-primary" />
                <span className="text-sm text-foreground">Pin this card</span>
              </label>
              <div className="flex gap-2 pt-1">
                <button onClick={saveRef}
                  className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  {editingId ? 'Update' : 'Save Card'}
                </button>
                <button onClick={() => { setShowForm(false); setEditingId(null) }}
                  className="px-3 py-2 rounded-md border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RefCard({
  ref_, expanded, setExpanded, onEdit, onDelete, onPin,
  inlineEdit, setInlineEdit, onSaveInline, textareaRef,
}: {
  ref_: QuickRef
  expanded: string | null
  setExpanded: (id: string | null) => void
  onEdit: (r: QuickRef) => void
  onDelete: (id: string) => void
  onPin: (r: QuickRef) => void
  inlineEdit: { id: string; field: string; val: string } | null
  setInlineEdit: (v: { id: string; field: 'title' | 'content'; val: string } | null) => void
  onSaveInline: () => void
  textareaRef: React.RefObject<HTMLTextAreaElement>
}) {
  const isExpanded = expanded === ref_.id
  const preview = ref_.content.slice(0, 120) + (ref_.content.length > 120 ? '…' : '')

  return (
    <div
      className="border border-border rounded-xl overflow-hidden flex flex-col"
      style={{ backgroundColor: ref_.color }}
    >
      {/* Card header */}
      <div className="px-3 pt-3 pb-2 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {inlineEdit?.id === ref_.id && inlineEdit.field === 'title' ? (
            <div className="flex gap-1">
              <input
                autoFocus value={inlineEdit.val}
                onChange={e => setInlineEdit({ ...inlineEdit, val: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') onSaveInline(); if (e.key === 'Escape') setInlineEdit(null) }}
                className="flex-1 text-sm font-semibold bg-transparent border-b border-primary outline-none text-foreground"
              />
              <button onClick={onSaveInline} className="text-primary"><Check className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <h3
              className="text-sm font-semibold text-foreground cursor-text hover:opacity-70"
              onDoubleClick={() => setInlineEdit({ id: ref_.id, field: 'title', val: ref_.title })}
            >
              {ref_.title}
            </h3>
          )}
          {ref_.subject && <p className="text-xs text-muted-foreground mt-0.5">{ref_.subject}</p>}
        </div>
        <div className="flex gap-0.5 flex-shrink-0">
          <button onClick={() => onPin(ref_)}
            className={cn('p-1 rounded transition-colors', ref_.is_pinned ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>
            <Pin className="h-3 w-3" />
          </button>
          <button onClick={() => onEdit(ref_)} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
            <Edit2 className="h-3 w-3" />
          </button>
          <button onClick={() => onDelete(ref_.id)} className="p-1 rounded text-muted-foreground hover:text-red-500 transition-colors">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pb-3 flex-1">
        {inlineEdit?.id === ref_.id && inlineEdit.field === 'content' ? (
          <div className="space-y-1">
            <textarea
              ref={textareaRef} autoFocus value={inlineEdit.val} rows={5}
              onChange={e => setInlineEdit({ ...inlineEdit, val: e.target.value })}
              className="w-full text-xs bg-transparent border border-border rounded p-1 outline-none resize-none font-mono text-foreground"
            />
            <div className="flex gap-1">
              <button onClick={onSaveInline} className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-xs">Save</button>
              <button onClick={() => setInlineEdit(null)} className="px-2 py-0.5 rounded border border-border text-xs text-muted-foreground">Cancel</button>
            </div>
          </div>
        ) : (
          <div
            className="cursor-pointer"
            onClick={() => setExpanded(isExpanded ? null : ref_.id)}
            onDoubleClick={() => setInlineEdit({ id: ref_.id, field: 'content', val: ref_.content })}
          >
            <pre className={cn(
              'text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed',
              !isExpanded && 'line-clamp-4'
            )}>
              {isExpanded ? ref_.content : preview}
            </pre>
            {ref_.content.length > 120 && (
              <span className="text-xs text-primary hover:underline mt-1 inline-block">
                {isExpanded ? 'Show less ↑' : 'Show more ↓'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tags */}
      {ref_.tags.length > 0 && (
        <div className="px-3 pb-2 flex gap-1 flex-wrap">
          {ref_.tags.map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
