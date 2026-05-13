import { useState, useMemo } from 'react'
import { differenceInDays, addDays, isBefore, isAfter } from 'date-fns'
import { AlertTriangle, TrendingUp } from 'lucide-react'
import { cn } from '../../lib/utils'

interface Phase {
  id: string
  label: string
  startPct: number // 0-100
  endPct: number   // 0-100
  color: string
}

interface Props {
  examDate: string
  completionPct: number
  totalLeafNodes: number
  dailyTargetHours: number
}

const DEFAULT_PHASES: Phase[] = [
  { id: 'foundation', label: 'Foundation', startPct: 0, endPct: 35, color: 'bg-blue-500' },
  { id: 'consolidation', label: 'Consolidation', startPct: 35, endPct: 65, color: 'bg-amber-500' },
  { id: 'revision', label: 'Intensive Revision', startPct: 65, endPct: 85, color: 'bg-emerald-500' },
  { id: 'final', label: 'Final Sprint', startPct: 85, endPct: 100, color: 'bg-red-500' },
]

export function RoadmapTimeline({ examDate, completionPct, totalLeafNodes, dailyTargetHours }: Props) {
  const today = new Date()
  const exam = new Date(examDate)
  const daysLeft = differenceInDays(exam, today)
  const totalDays = differenceInDays(exam, addDays(today, -daysLeft))
  
  const [phases] = useState<Phase[]>(DEFAULT_PHASES)

  // Feasibility check
  const avgHoursPerNode = 2 // assume 2 hours per topic on average
  const remainingHours = totalLeafNodes * avgHoursPerNode * (1 - completionPct / 100)
  const hoursNeededPerDay = daysLeft > 0 ? remainingHours / daysLeft : 0
  const feasible = hoursNeededPerDay <= dailyTargetHours

  const phaseDates = useMemo(() => {
    return phases.map((phase) => {
      const startDay = Math.round((phase.startPct / 100) * totalDays)
      const endDay = Math.round((phase.endPct / 100) * totalDays)
      const start = addDays(exam, -totalDays + startDay)
      const end = addDays(exam, -totalDays + endDay)
      return { ...phase, start, end }
    })
  }, [phases, exam, totalDays])

  const currentPosition = useMemo(() => {
    const elapsed = differenceInDays(today, addDays(exam, -totalDays))
    return Math.min((elapsed / totalDays) * 100, 100)
  }, [today, exam, totalDays])

  return (
    <div className="border border-border rounded-lg bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Study Roadmap</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {daysLeft} days until exam · {completionPct.toFixed(0)}% done
        </span>
      </div>

      {/* Feasibility Warning */}
      {!feasible && daysLeft > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <div className="text-xs text-red-700 dark:text-red-300">
            <span className="font-medium">Pace Warning:</span> You need ~{hoursNeededPerDay.toFixed(1)} hrs/day, 
            but your target is {dailyTargetHours} hrs/day. Consider adjusting your plan.
          </div>
        </div>
      )}

      {/* Timeline bar */}
      <div className="relative h-10 rounded-full bg-muted overflow-hidden">
        {phaseDates.map((phase) => {
          const width = phase.endPct - phase.startPct
          return (
            <div
              key={phase.id}
              className={cn('absolute top-0 h-full flex items-center justify-center text-[10px] font-medium text-white', phase.color)}
              style={{ left: `${phase.startPct}%`, width: `${width}%` }}
            >
              {width > 10 && phase.label}
            </div>
          )
        })}

        {/* Current position marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-foreground z-10"
          style={{ left: `${currentPosition}%` }}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-foreground whitespace-nowrap">
            Today
          </div>
        </div>
      </div>

      {/* Phase legend */}
      <div className="flex flex-wrap gap-3">
        {phaseDates.map((phase) => {
          const isActive = isBefore(today, phase.end) && isAfter(today, phase.start)
          const isPast = isAfter(today, phase.end)
          return (
            <div key={phase.id} className="flex items-center gap-1.5">
              <div className={cn('h-3 w-3 rounded-sm', phase.color, isPast && 'opacity-40')} />
              <span className={cn('text-xs', isActive ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                {phase.label}
              </span>
              {isActive && (
                <span className="text-[10px] px-1 py-px rounded bg-primary/10 text-primary">
                  Current
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}