import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, Coffee, Brain, Settings, X, Check } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useStartSession, useEndSession } from '../../lib/queries/sessions'

type TimerState = 'idle' | 'running' | 'paused' | 'finished'

interface Durations {
  focus: number
  break: number
  long_break: number
}

const DEFAULTS: Durations = { focus: 25, break: 5, long_break: 15 }
const STORAGE_KEY = 'prep-pomodoro-durations'

function loadDurations(): Durations {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s) return { ...DEFAULTS, ...JSON.parse(s) }
  } catch {}
  return { ...DEFAULTS }
}

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val))
}

export function PomodoroTimer() {
  const startSession = useStartSession()
  const endSession = useEndSession()

  const [durations, setDurations] = useState<Durations>(loadDurations)
  const [showSettings, setShowSettings] = useState(false)
  const [draft, setDraft] = useState<Durations>(durations)

  const [mode, setMode] = useState<'focus' | 'break' | 'long_break'>('focus')
  const [timeLeft, setTimeLeft] = useState(loadDurations().focus * 60)
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const modeConfig = {
    focus:      { label: 'Focus',      duration: durations.focus * 60,      color: 'text-red-500'   },
    break:      { label: 'Break',      duration: durations.break * 60,      color: 'text-green-500' },
    long_break: { label: 'Long Break', duration: durations.long_break * 60, color: 'text-blue-500'  },
  }

  const totalDuration = modeConfig[mode].duration
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100
  const config = modeConfig[mode]

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearTimer()
            setTimerState('finished')
            try {
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAf39/f4B/f3+AgH9/f3+Af39/gIB/f3+Af3+Af39/gH9/f4CAf39/gH9/f39/f39/f3+Af39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/fA==')
              audio.play().catch(() => {})
            } catch {}
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return clearTimer
  }, [timerState, clearTimer])

  const start = async () => {
    if (timerState === 'idle') {
      const session = await startSession.mutateAsync({ session_type: mode })
      setSessionId(session.id)
    }
    setTimerState('running')
  }

  const pause = () => setTimerState('paused')
  const resume = () => setTimerState('running')

  const endSessionAndReset = async () => {
    if (sessionId) await endSession.mutateAsync({ sessionId })

    if (mode === 'focus') {
      const newCount = sessionsCompleted + 1
      setSessionsCompleted(newCount)
      const nextMode = newCount % 4 === 0 ? 'long_break' : 'break'
      setMode(nextMode)
      setTimeLeft(modeConfig[nextMode].duration)
    } else {
      setMode('focus')
      setTimeLeft(modeConfig.focus.duration)
    }

    setTimerState('idle')
    setSessionId(null)
  }

  const switchMode = (newMode: typeof mode) => {
    if (sessionId) endSession.mutate({ sessionId })
    setMode(newMode)
    setTimeLeft(modeConfig[newMode].duration)
    setTimerState('idle')
    setSessionId(null)
  }

  const openSettings = () => {
    setDraft({ ...durations })
    setShowSettings(true)
  }

  const saveSettings = () => {
    const newDurations: Durations = {
      focus:      clamp(draft.focus,      1, 120),
      break:      clamp(draft.break,      1,  60),
      long_break: clamp(draft.long_break, 1,  60),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDurations))
    setDurations(newDurations)
    setTimeLeft(newDurations[mode] * 60)
    setTimerState('idle')
    if (sessionId) {
      endSession.mutate({ sessionId })
      setSessionId(null)
    }
    setShowSettings(false)
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="flex flex-col items-center space-y-6 relative">
      {/* Mode tabs + settings */}
      <div className="flex items-center gap-2">
        <div className="flex bg-muted rounded-lg p-0.5">
          {(Object.keys(modeConfig) as Array<keyof typeof modeConfig>).map((key) => (
            <button
              key={key}
              onClick={() => switchMode(key)}
              disabled={timerState === 'running' || timerState === 'paused'}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50',
                mode === key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {key === 'focus' ? (
                <Brain className="h-3 w-3" />
              ) : (
                <Coffee className="h-3 w-3" />
              )}
              {modeConfig[key].label}
            </button>
          ))}
        </div>

        <button
          onClick={openSettings}
          disabled={timerState === 'running' || timerState === 'paused'}
          title="Timer settings"
          className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute top-10 right-0 z-20 w-64 bg-card border border-border rounded-xl shadow-lg p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-foreground">Timer Durations</span>
            <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {(
            [
              { key: 'focus',      label: 'Focus (min)',      min: 1, max: 120 },
              { key: 'break',      label: 'Break (min)',      min: 1, max:  60 },
              { key: 'long_break', label: 'Long Break (min)', min: 1, max:  60 },
            ] as const
          ).map(({ key, label, min, max }) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground">{label}</label>
              <input
                type="number"
                min={min}
                max={max}
                value={draft[key]}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [key]: parseInt(e.target.value) || min }))
                }
                className="w-full mt-0.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <button
              onClick={saveSettings}
              className="flex-1 flex items-center justify-center gap-1 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              Save
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="flex-1 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Timer circle */}
      <div className="relative w-64 h-64">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="44"
            fill="none" stroke="currentColor" strokeWidth="3"
            className="text-muted/20"
          />
          <circle
            cx="50" cy="50" r="44"
            fill="none" stroke="currentColor" strokeWidth="3"
            strokeLinecap="round"
            className={config.color}
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-6xl font-bold tabular-nums', config.color)}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className="text-xs text-muted-foreground mt-2">{config.label}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {timerState === 'idle' && (
          <button
            onClick={start}
            disabled={startSession.isPending}
            className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Play className="h-4 w-4 fill-current" />
            Start {config.label}
          </button>
        )}

        {timerState === 'running' && (
          <button
            onClick={pause}
            className="flex items-center gap-2 rounded-full bg-amber-500 text-white px-6 py-3 text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            <Pause className="h-4 w-4 fill-current" />
            Pause
          </button>
        )}

        {timerState === 'paused' && (
          <>
            <button
              onClick={resume}
              className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Play className="h-4 w-4 fill-current" />
              Resume
            </button>
            <button
              onClick={endSessionAndReset}
              disabled={endSession.isPending}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Skip
            </button>
          </>
        )}

        {timerState === 'finished' && (
          <button
            onClick={endSessionAndReset}
            disabled={endSession.isPending}
            className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            {mode === 'focus' ? 'Take a Break' : 'Start Focus'}
          </button>
        )}
      </div>

      {/* Session counter */}
      <div className="text-xs text-muted-foreground">
        {sessionsCompleted} focus session{sessionsCompleted === 1 ? '' : 's'} completed today
      </div>
    </div>
  )
}
