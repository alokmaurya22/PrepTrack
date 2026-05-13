import { useState } from 'react'
import { ArrowRight, RotateCcw, CheckCircle2 } from 'lucide-react'
import { useDueKeyNotes, useReviewKeyNote, type KeyNote } from '../../lib/queries/keyNotes'
import { cn } from '../../lib/utils'

const QUALITY_LABELS = [
  { value: 0 as const, label: 'Forgot', color: 'bg-red-500 hover:bg-red-600' },
  { value: 1 as const, label: 'Hard', color: 'bg-orange-500 hover:bg-orange-600' },
  { value: 2 as const, label: 'Good', color: 'bg-emerald-500 hover:bg-emerald-600' },
  { value: 3 as const, label: 'Easy', color: 'bg-blue-500 hover:bg-blue-600' },
]

export function ReviewSession() {
  const { data: dueNotes, isLoading } = useDueKeyNotes()
  const reviewKeyNote = useReviewKeyNote()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [showBack, setShowBack] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [finished, setFinished] = useState(false)

  const notes = dueNotes || []
  const currentNote: KeyNote | undefined = notes[currentIndex]
  const totalDue = notes.length

  const handleReview = (quality: 0 | 1 | 2 | 3) => {
    if (!currentNote) return

    reviewKeyNote.mutate({
      id: currentNote.id,
      quality,
      currentState: {
        ease_factor: currentNote.ease_factor,
        interval_days: currentNote.interval_days,
        repetitions: currentNote.repetitions,
      },
    })

    setShowBack(false)
    const newReviewed = reviewedCount + 1
    setReviewedCount(newReviewed)

    if (currentIndex + 1 < totalDue) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setFinished(true)
    }
  }

  const restart = () => {
    setCurrentIndex(0)
    setShowBack(false)
    setReviewedCount(0)
    setFinished(false)
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground animate-pulse">
        Loading flashcards…
      </div>
    )
  }

  if (totalDue === 0 && !finished) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
        <h3 className="text-lg font-semibold text-foreground">All caught up!</h3>
        <p className="text-sm text-muted-foreground mt-1">No flashcards due for review.</p>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
        <h3 className="text-lg font-semibold text-foreground">Great job!</h3>
        <p className="text-sm text-muted-foreground mt-1">
          You reviewed {reviewedCount} {reviewedCount === 1 ? 'card' : 'cards'} today.
        </p>
        <button
          onClick={restart}
          className="mt-4 flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Review Again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-6 py-8 px-4">
      {/* Progress */}
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>
            Card {currentIndex + 1} of {totalDue}
          </span>
          <span>{reviewedCount} reviewed</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalDue) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="w-full max-w-md min-h-[200px]">
        <div
          className={cn(
            'relative w-full rounded-xl border-2 border-border bg-card p-6 shadow-lg transition-all duration-300',
            showBack && 'border-primary/50'
          )}
        >
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
              {showBack ? 'Answer' : 'Question'}
            </p>
            <p className="text-lg font-medium text-foreground leading-relaxed">
              {showBack ? currentNote.back_text : currentNote.front_text}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {!showBack ? (
        <button
          onClick={() => setShowBack(true)}
          className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Show Answer
          <ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          {QUALITY_LABELS.map((q) => (
            <button
              key={q.value}
              onClick={() => handleReview(q.value)}
              disabled={reviewKeyNote.isPending}
              className={cn(
                'rounded-full text-white px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50',
                q.color
              )}
            >
              {q.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}