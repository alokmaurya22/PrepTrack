export interface SM2State {
  ease_factor: number   // min 1.3, default 2.5
  interval_days: number // current interval
  repetitions: number
}

// quality: 0=Forgot, 1=Hard, 2=Good, 3=Easy
export function calculateNextReview(
  state: SM2State,
  quality: 0 | 1 | 2 | 3
): SM2State & { next_review_days: number } {
  let { ease_factor, interval_days, repetitions } = state

  if (quality === 0) {
    // Forgot → reset to beginning
    return { ease_factor, interval_days: 1, repetitions: 0, next_review_days: 1 }
  }

  const efDelta = 0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02)
  ease_factor = Math.max(1.3, ease_factor + efDelta)

  if (repetitions === 0) interval_days = 1
  else if (repetitions === 1) interval_days = 6
  else interval_days = Math.round(interval_days * ease_factor)

  return {
    ease_factor,
    interval_days,
    repetitions: repetitions + 1,
    next_review_days: interval_days,
  }
}

export function getDefaultSM2State(): SM2State {
  return { ease_factor: 2.5, interval_days: 0, repetitions: 0 }
}