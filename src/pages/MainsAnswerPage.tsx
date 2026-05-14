import { useState } from 'react'
import { Plus, Trash2, Star } from 'lucide-react'
import { useMainsAnswers, useAddMainsAnswer, useDeleteMainsAnswer, type MainsAnswer } from '../lib/queries/pyq'
import { cn } from '../lib/utils'

const RATING_LABELS = ['Structure', 'Content', 'Diagrams', 'Conclusion']

export function MainsAnswerPage() {
  const { data: answers, isLoading } = useMainsAnswers()
  const addAnswer = useAddMainsAnswer()
  const deleteAnswer = useDeleteMainsAnswer()
  const [showForm, setShowForm] = useState(false)

  const [qText, setQText] = useState('')
  const [aText, setAText] = useState('')
  const [structure, setStructure] = useState(0)
  const [content, setContent] = useState(0)
  const [diagram, setDiagram] = useState(0)
  const [conclusion, setConclusion] = useState(0)
  const [review, setReview] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!qText.trim()) return
    addAnswer.mutate(
      {
        question_text: qText.trim(),
        answer_text: aText || undefined,
        structure_rating: structure || undefined,
        content_rating: content || undefined,
        diagram_rating: diagram || undefined,
        conclusion_rating: conclusion || undefined,
        review_notes: review || undefined,
      },
      {
        onSuccess: () => {
          setShowForm(false)
          setQText(''); setAText('')
          setStructure(0); setContent(0); setDiagram(0); setConclusion(0)
          setReview('')
        },
      }
    )
  }

  const RatingInput = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div>
      <label className="text-[10px] text-muted-foreground mb-1 block">{label}</label>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n === value ? 0 : n)}
            className={cn(
              'p-1 rounded transition-colors',
              n <= value ? 'text-amber-500' : 'text-muted-foreground/30 hover:text-amber-400'
            )}
          >
            <Star className="h-4 w-4" fill={n <= value ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    </div>
  )

  const getAvgRating = (a: MainsAnswer) => {
    const ratings = [a.structure_rating, a.content_rating, a.diagram_rating, a.conclusion_rating].filter((r): r is number => r !== null && r > 0)
    if (ratings.length === 0) return null
    return (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)
  }

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><div className="text-muted-foreground animate-pulse">Loading answers…</div></div>
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Mains Answer Tracker</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5" /> Log Answer
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {answers && answers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No Mains answers logged yet</p>
            <p className="text-xs text-muted-foreground mt-1">Track your answer writing practice here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {answers?.map((a) => {
              const avg = getAvgRating(a)
              return (
                <div key={a.id} className="border border-border rounded-lg p-4 bg-card group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{a.question_text}</p>
                      {a.answer_text && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{a.answer_text}</p>
                      )}
                      {avg && (
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {RATING_LABELS.map((label, i) => {
                            const ratings = [a.structure_rating, a.content_rating, a.diagram_rating, a.conclusion_rating]
                            return (
                              <div key={label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <span>{label}:</span>
                                <span className="text-amber-500 font-medium">{ratings[i] || '—'}/5</span>
                              </div>
                            )
                          })}
                          <span className="text-xs font-semibold text-foreground ml-auto tabular-nums">Avg {avg}</span>
                        </div>
                      )}
                      {a.review_notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-muted pl-2">{a.review_notes}</p>
                      )}
                    </div>
                    <button onClick={() => deleteAnswer.mutate(a.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive flex-shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Log Mains Answer</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea placeholder="Question" value={qText} onChange={(e) => setQText(e.target.value)} rows={2} autoFocus className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
              <textarea placeholder="Your answer (optional)" value={aText} onChange={(e) => setAText(e.target.value)} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <RatingInput label="Structure" value={structure} onChange={setStructure} />
                <RatingInput label="Content" value={content} onChange={setContent} />
                <RatingInput label="Diagrams" value={diagram} onChange={setDiagram} />
                <RatingInput label="Conclusion" value={conclusion} onChange={setConclusion} />
              </div>
              <textarea placeholder="Review notes (optional)" value={review} onChange={(e) => setReview(e.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={addAnswer.isPending || !qText.trim()} className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{addAnswer.isPending ? 'Saving…' : 'Save Answer'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}