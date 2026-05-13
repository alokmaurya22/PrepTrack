import { Star } from 'lucide-react'

interface Props {
  rating: number | null
  onChange?: (rating: number) => void
  size?: 'sm' | 'md'
}

export function ConfidenceStars({ rating, onChange, size = 'sm' }: Props) {
  const starSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <div className="flex gap-0.5" title={`Confidence: ${rating ?? 0}/5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={(e) => {
            e.stopPropagation()
            onChange?.(star)
          }}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
          tabIndex={-1}
        >
          <Star
            className={`${starSize} transition-colors ${
              star <= (rating ?? 0)
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/25 hover:text-amber-400/50'
            }`}
          />
        </button>
      ))}
    </div>
  )
}