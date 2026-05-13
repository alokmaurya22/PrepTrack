import { useState } from 'react'
import { Plus, Trash2, TrendingUp, AlertTriangle, X } from 'lucide-react'
import {
  useTests,
  useCreateTest,
  useDeleteTest,
  useAllMistakes,
  useAddMistake,
  useDeleteMistake,
  type Test,
} from '../lib/queries/tests'
import { cn } from '../lib/utils'
import { format } from 'date-fns'

const TEST_TYPES = [
  { value: 'prelims', label: 'Prelims' },
  { value: 'mains', label: 'Mains' },
  { value: 'sectional', label: 'Sectional' },
  { value: 'full_length', label: 'Full Length' },
  { value: 'pyq', label: 'PYQ' },
  { value: 'other', label: 'Other' },
]

export function TestsPage() {
  const { data: tests, isLoading } = useTests()
  const createTest = useCreateTest()
  const deleteTest = useDeleteTest()
  const { data: allMistakes } = useAllMistakes()
  const addMistake = useAddMistake()
  const deleteMistake = useDeleteMistake()

  const [showForm, setShowForm] = useState(false)
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [showMistakeForm, setShowMistakeForm] = useState(false)
  const [view, setView] = useState<'tests' | 'mistakes'>('tests')

  // Form state
  const [name, setName] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [type, setType] = useState('prelims')
  const [totalMarks, setTotalMarks] = useState('')
  const [scoredMarks, setScoredMarks] = useState('')
  const [timeTaken, setTimeTaken] = useState('')
  const [notes, setNotes] = useState('')

  // Mistake form state
  const [questionText, setQuestionText] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [yourAnswer, setYourAnswer] = useState('')
  const [reasoning, setReasoning] = useState('')

  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !totalMarks || !scoredMarks) return
    createTest.mutate(
      {
        name: name.trim(),
        date,
        type: type as Test['type'],
        total_marks: parseInt(totalMarks),
        scored_marks: parseInt(scoredMarks),
        time_taken_minutes: timeTaken ? parseInt(timeTaken) : null,
        source: null,
        notes: notes || null,
      },
      {
        onSuccess: () => {
          setShowForm(false)
          setName('')
          setTotalMarks('')
          setScoredMarks('')
          setTimeTaken('')
          setNotes('')
        },
      }
    )
  }

  const handleAddMistake = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTest || !questionText.trim()) return
    addMistake.mutate(
      {
        test_id: selectedTest.id,
        question_text: questionText.trim(),
        correct_answer: correctAnswer || undefined,
        your_answer: yourAnswer || undefined,
        reasoning: reasoning || undefined,
      },
      {
        onSuccess: () => {
          setShowMistakeForm(false)
          setQuestionText('')
          setCorrectAnswer('')
          setYourAnswer('')
          setReasoning('')
        },
      }
    )
  }

  const getScorePct = (test: Test) =>
    test.total_marks > 0 ? Math.round((test.scored_marks / test.total_marks) * 100) : 0

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return 'text-emerald-500'
    if (pct >= 60) return 'text-amber-500'
    return 'text-red-500'
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading tests…</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setView('tests')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                view === 'tests'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Tests ({tests?.length || 0})
            </button>
            <button
              onClick={() => setView('mistakes')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                view === 'mistakes'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Mistakes ({allMistakes?.length || 0})
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Log Test
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {view === 'tests' ? (
          <>
            {/* Performance trend */}
            {tests && tests.length >= 2 && (
              <div className="mb-4 p-4 border border-border rounded-lg bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Score Trend</span>
                </div>
                <div className="flex items-end gap-1 h-32">
                  {tests
                    .slice()
                    .reverse()
                    .slice(-20)
                    .map((test) => {
                      const pct = getScorePct(test)
                      return (
                        <div key={test.id} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">{pct}%</span>
                          <div
                            className="w-full rounded-t-sm transition-all"
                            style={{
                              height: `${pct}%`,
                              backgroundColor: pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444',
                              minHeight: '4px',
                            }}
                          />
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {tests && tests.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No tests logged yet</p>
                <p className="text-xs text-muted-foreground mt-1">Log your first mock test to start tracking</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tests?.map((test) => {
                  const pct = getScorePct(test)
                  return (
                    <div
                      key={test.id}
                      className="border border-border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">{test.name}</h3>
                            <span className="text-[10px] px-1.5 py-px rounded-full bg-muted text-muted-foreground">
                              {TEST_TYPES.find((t) => t.value === test.type)?.label || test.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{format(new Date(test.date), 'MMM d, yyyy')}</span>
                            <span className={cn('font-semibold', getScoreColor(pct))}>
                              {test.scored_marks}/{test.total_marks} ({pct}%)
                            </span>
                            {test.time_taken_minutes && <span>{test.time_taken_minutes} min</span>}
                          </div>
                          {test.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{test.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedTest(test)
                              setShowMistakeForm(true)
                            }}
                            className="flex items-center gap-1 text-xs text-amber-500 hover:bg-amber-500/10 rounded px-2 py-1 transition-colors"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            Mistakes
                          </button>
                          <button
                            onClick={() => deleteTest.mutate(test.id)}
                            className="text-xs text-muted-foreground hover:text-destructive p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <div>
            {allMistakes && allMistakes.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No mistakes logged</p>
                <p className="text-xs text-muted-foreground mt-1">Log mistakes from your tests to track weak areas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allMistakes?.map((mistake) => (
                  <div key={mistake.id} className="border border-border rounded-lg p-3 bg-card">
                    <p className="text-sm font-medium text-foreground">{mistake.question_text}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs">
                      <span className="text-red-500">Your: {mistake.your_answer || '—'}</span>
                      <span className="text-emerald-500">Correct: {mistake.correct_answer || '—'}</span>
                    </div>
                    {mistake.reasoning && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{mistake.reasoning}</p>
                    )}
                    <button
                      onClick={() => deleteMistake.mutate(mistake.id)}
                      className="text-[10px] text-muted-foreground hover:text-destructive mt-1"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Test Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Log Test</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTest} className="space-y-3">
              <input
                type="text"
                placeholder="Test name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {TEST_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  placeholder="Total marks"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="number"
                  placeholder="Scored"
                  value={scoredMarks}
                  onChange={(e) => setScoredMarks(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="number"
                  placeholder="Time (min)"
                  value={timeTaken}
                  onChange={(e) => setTimeTaken(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <textarea
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={createTest.isPending || !name.trim() || !totalMarks || !scoredMarks}
                  className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {createTest.isPending ? 'Saving…' : 'Save Test'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mistake Form Modal */}
      {showMistakeForm && selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Log Mistake — {selectedTest.name}</h3>
              <button onClick={() => setShowMistakeForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddMistake} className="space-y-3">
              <textarea
                placeholder="Question text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={2}
                autoFocus
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Your answer"
                  value={yourAnswer}
                  onChange={(e) => setYourAnswer(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="text"
                  placeholder="Correct answer"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <textarea
                placeholder="Reasoning / explanation (optional)"
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={addMistake.isPending || !questionText.trim()}
                  className="flex-1 rounded-md bg-amber-500 text-white px-4 py-2 text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {addMistake.isPending ? 'Saving…' : 'Log Mistake'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMistakeForm(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}