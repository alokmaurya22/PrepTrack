import { useState, useMemo } from 'react'
import { Plus, Trash2, Check, X as XIcon, SkipForward, Edit3 } from 'lucide-react'
import { usePYQQuestions, usePYQSummary, useAddPYQ, useUpdatePYQ, useDeletePYQ, type PYQQuestion } from '../lib/queries/pyq'
import { cn } from '../lib/utils'

const PAPERS = ['GS1', 'GS2', 'GS3', 'GS4', 'Essay', 'CSAT']
const YEARS = Array.from({ length: 47 }, (_, i) => 2025 - i) // 1979-2025
const STATUS_COLORS: Record<string, string> = {
  not_attempted: 'bg-muted text-muted-foreground',
  correct: 'bg-emerald-500/20 text-emerald-600',
  wrong: 'bg-red-500/20 text-red-600',
  skipped: 'bg-amber-500/20 text-amber-600',
}
const STATUS_ICONS: Record<string, React.ReactNode> = {
  not_attempted: null,
  correct: <Check className="h-3 w-3" />,
  wrong: <XIcon className="h-3 w-3" />,
  skipped: <SkipForward className="h-3 w-3" />,
}

export function PYQPage() {
  const [selectedYear, setSelectedYear] = useState(2025)
  const [selectedPaper, setSelectedPaper] = useState('GS1')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { data: questions, isLoading } = usePYQQuestions(selectedYear, selectedPaper)
  const { data: summary } = usePYQSummary()
  const addPYQ = useAddPYQ()
  const updatePYQ = useUpdatePYQ()
  const deletePYQ = useDeletePYQ()

  const [qNum, setQNum] = useState('')
  const [qText, setQText] = useState('')
  const [qStatus, setQStatus] = useState('not_attempted')
  const [qAnswer, setQAnswer] = useState('')
  const [qNotes, setQNotes] = useState('')

  // Build summary grid
  const summaryGrid = useMemo(() => {
    if (!summary) return {}
    const grid: Record<string, Record<string, { total: number; correct: number; wrong: number; skipped: number }>> = {}
    summary.forEach((q) => {
      const y = String(q.year)
      if (!grid[y]) grid[y] = {}
      if (!grid[y][q.paper]) grid[y][q.paper] = { total: 0, correct: 0, wrong: 0, skipped: 0 }
      grid[y][q.paper].total++
      if (q.status === 'correct') grid[y][q.paper].correct++
      if (q.status === 'wrong') grid[y][q.paper].wrong++
      if (q.status === 'skipped') grid[y][q.paper].skipped++
    })
    return grid
  }, [summary])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updatePYQ.mutate(
        {
          id: editingId,
          question_number: qNum ? parseInt(qNum) : undefined,
          question_text: qText || undefined,
          status: qStatus as PYQQuestion['status'],
          your_answer: qAnswer || undefined,
          notes: qNotes || undefined,
        },
        { onSuccess: () => { setShowForm(false); setEditingId(null); resetForm() } }
      )
    } else {
      addPYQ.mutate(
        {
          year: selectedYear,
          paper: selectedPaper,
          question_number: qNum ? parseInt(qNum) : undefined,
          question_text: qText || undefined,
          status: qStatus,
          your_answer: qAnswer || undefined,
          notes: qNotes || undefined,
        },
        { onSuccess: () => { setShowForm(false); resetForm() } }
      )
    }
  }

  const resetForm = () => {
    setQNum(''); setQText(''); setQStatus('not_attempted'); setQAnswer(''); setQNotes('')
  }

  const startEdit = (q: PYQQuestion) => {
    setEditingId(q.id)
    setQNum(q.question_number?.toString() || '')
    setQText(q.question_text || '')
    setQStatus(q.status)
    setQAnswer(q.your_answer || '')
    setQNotes(q.notes || '')
    setShowForm(true)
  }

  const stats = useMemo(() => {
    if (!questions) return { total: 0, correct: 0, wrong: 0, skipped: 0, pending: 0 }
    return {
      total: questions.length,
      correct: questions.filter((q) => q.status === 'correct').length,
      wrong: questions.filter((q) => q.status === 'wrong').length,
      skipped: questions.filter((q) => q.status === 'skipped').length,
      pending: questions.filter((q) => q.status === 'not_attempted').length,
    }
  }, [questions])

  // Years that have at least one logged question
  const yearsWithData = useMemo(() => {
    const set = new Set(Object.keys(summaryGrid).map(Number))
    return YEARS.filter((y) => set.has(y))
  }, [summaryGrid])

  const [showAllYears, setShowAllYears] = useState(false)
  const gridYears = showAllYears ? YEARS : yearsWithData.length > 0 ? yearsWithData : YEARS.slice(0, 10)

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><div className="text-muted-foreground animate-pulse">Loading PYQs…</div></div>
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg font-semibold text-foreground">PYQ Tracker</h2>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="text-xs border border-border rounded-md px-2 py-1.5 bg-background">
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={selectedPaper} onChange={(e) => setSelectedPaper(e.target.value)} className="text-xs border border-border rounded-md px-2 py-1.5 bg-background">
            {PAPERS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditingId(null); resetForm(); setShowForm(true) }} className="flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5" /> Add Question
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Stats bar */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <span className="text-xs px-2 py-1 rounded bg-muted">Total: {stats.total}</span>
          <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-600">✓ {stats.correct}</span>
          <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-600">✗ {stats.wrong}</span>
          <span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-600">⏭ {stats.skipped}</span>
          <span className="text-xs px-2 py-1 rounded bg-muted">○ {stats.pending}</span>
        </div>

        {/* Summary grid */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Summary Grid</span>
            <button
              onClick={() => setShowAllYears((v) => !v)}
              className="text-xs text-primary hover:underline"
            >
              {showAllYears ? 'Show years with data only' : `Show all ${YEARS.length} years`}
            </button>
          </div>
          <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left font-medium">Year</th>
                {PAPERS.map((p) => <th key={p} className="p-2 text-center font-medium">{p}</th>)}
              </tr>
            </thead>
            <tbody>
              {gridYears.map((y) => (
                <tr key={y} className="border-t border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedYear(y)}>
                  <td className={cn('p-2 font-medium', y === selectedYear && 'text-primary')}>{y}</td>
                  {PAPERS.map((p) => {
                    const cell = summaryGrid[String(y)]?.[p]
                    return (
                      <td key={p} className="p-2 text-center">
                        {cell ? (
                          <span className={cn('px-1.5 py-0.5 rounded text-[10px]', cell.correct === cell.total ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted')}>
                            {cell.correct}/{cell.total}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Questions list */}
        <div className="space-y-2">
          {questions && questions.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No questions logged for {selectedPaper} {selectedYear}</div>
          ) : (
            questions?.map((q) => (
              <div key={q.id} className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card group">
                <span className={cn('px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1', STATUS_COLORS[q.status])}>
                  {STATUS_ICONS[q.status]} {q.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-muted-foreground font-mono">Q{q.question_number || '—'}</span>
                <span className="text-sm text-foreground flex-1 truncate">{q.question_text || 'Untitled question'}</span>
                <button onClick={() => startEdit(q)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground"><Edit3 className="h-3 w-3" /></button>
                <button onClick={() => deletePYQ.mutate(q.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">{editingId ? 'Edit Question' : 'Add PYQ'}</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><XIcon className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Q number" value={qNum} onChange={(e) => setQNum(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                <select value={qStatus} onChange={(e) => setQStatus(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="not_attempted">Not Attempted</option>
                  <option value="correct">Correct</option>
                  <option value="wrong">Wrong</option>
                  <option value="skipped">Skipped</option>
                </select>
              </div>
              <textarea placeholder="Question text" value={qText} onChange={(e) => setQText(e.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
              <input type="text" placeholder="Your answer" value={qAnswer} onChange={(e) => setQAnswer(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea placeholder="Notes (optional)" value={qNotes} onChange={(e) => setQNotes(e.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={addPYQ.isPending || updatePYQ.isPending} className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {editingId ? 'Update' : 'Add Question'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}