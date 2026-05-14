import { useState } from 'react'
import { ArrowRight, RotateCcw } from 'lucide-react'
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
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <span className="text-5xl">✅</span>
        <h3 className="text-xl font-bold text-foreground">All Caught Up!</h3>
        <p className="text-sm text-muted-foreground">Come back tomorrow!</p>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <span className="text-5xl">🎉</span>
        <h3 className="text-xl font-bold text-foreground">Session Complete!</h3>
        <p className="text-sm text-muted-foreground">
          You reviewed{' '}
          <span className="font-semibold text-foreground">
            {reviewedCount} {reviewedCount === 1 ? 'card' : 'cards'}
          </span>{' '}
          today.
        </p>
        <button
          onClick={restart}
          className="mt-2 flex items-center gap-2 rounded-full bg-violet-600 text-white px-6 py-2.5 text-sm font-medium hover:bg-violet-700 transition-colors shadow-md"
        >
          <RotateCcw className="h-4 w-4" />
          Review Again
        </button>
      </div>
    )
  }

  const progress = ((currentIndex + 1) / totalDue) * 100

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
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-violet-500 to-indigo-600"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 3D Flip Card */}
      <div className="w-full max-w-md" style={{ perspective: '1200px' }}>
        <div
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.55s cubic-bezier(0.4,0.2,0.2,1)',
            transform: showBack ? 'rotateY(180deg)' : 'rotateY(0deg)',
            position: 'relative',
            height: '280px',
          }}
        >
          {/* Front face */}
          <div
            onClick={() => setShowBack(true)}
            style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}
            className="rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-xl cursor-pointer flex flex-col items-center justify-between p-8 select-none"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-white/60">
              Question
            </span>
            <p className="text-xl font-bold text-white text-center leading-relaxed">
              {currentNote.front_text}
            </p>
            <div className="flex items-center gap-1.5 text-white/50 text-xs">
              <ArrowRight className="h-3.5 w-3.5" />
              tap to flip
            </div>
          </div>

          {/* Back face */}
          <div
            onClick={() => setShowBack(false)}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              position: 'absolute',
              inset: 0,
            }}
            className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl cursor-pointer flex flex-col items-center justify-between p-8 select-none"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-white/60">
              Answer
            </span>
            <p className="text-lg font-medium text-white text-center leading-relaxed">
              {currentNote.back_text}
            </p>
            <div className="flex items-center gap-1.5 text-white/50 text-xs">
              <RotateCcw className="h-3.5 w-3.5" />
              tap to flip back
            </div>
          </div>
        </div>
      </div>

      {/* Rating buttons — only visible when back is shown */}
      <div
        className={cn(
          'flex flex-wrap justify-center gap-2 transition-all duration-300',
          showBack ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
        )}
      >
        {QUALITY_LABELS.map((q) => (
          <button
            key={q.value}
            onClick={() => handleReview(q.value)}
            disabled={reviewKeyNote.isPending}
            className={cn(
              'rounded-full text-white px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 shadow-md',
              q.color
            )}
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  )
}
