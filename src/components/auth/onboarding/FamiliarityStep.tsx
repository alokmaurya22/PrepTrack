import { Star } from 'lucide-react'

interface StepProps {
  data: Record<string, unknown>
  onUpdate: (d: Record<string, unknown>) => void
}

const TOP_LEVEL_SUBJECTS = [
  { id: 'history', name: 'History & Indian National Movement' },
  { id: 'geography', name: 'Geography' },
  { id: 'polity', name: 'Indian Polity & Governance' },
  { id: 'economy', name: 'Economic & Social Development' },
  { id: 'environment', name: 'Environment & Ecology' },
  { id: 'science', name: 'General Science & Technology' },
  { id: 'current_affairs', name: 'Current Events' },
  { id: 'csat', name: 'CSAT (Aptitude)' },
  { id: 'ethics', name: 'Ethics & Integrity (GS4)' },
  { id: 'essay', name: 'Essay Writing' },
]

export function FamiliarityStep({ data, onUpdate }: StepProps) {
  const ratings = (data.familiarityRatings as Record<string, number>) || {}

  const setRating = (subjectId: string, value: number) => {
    onUpdate({
      familiarityRatings: { ...ratings, [subjectId]: value }
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">How familiar are you with each subject?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Rate your current comfort level. This helps us estimate how much time you need per subject.
        </p>
      </div>

      <div className="space-y-1 max-h-80 overflow-y-auto">
        {TOP_LEVEL_SUBJECTS.map(subject => {
          const rating = ratings[subject.id] || 0
          return (
            <div
              key={subject.id}
              className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm text-foreground flex-1">{subject.name}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(subject.id, star)}
                    className="p-0.5 transition-colors"
                    title={`${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Star
                      className={`h-5 w-5 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/30 hover:text-amber-400/50'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-4 justify-center text-xs text-muted-foreground">
        <span>1 = No background</span>
        <span>3 = Some familiarity</span>
        <span>5 = Well-prepared</span>
      </div>
    </div>
  )
}