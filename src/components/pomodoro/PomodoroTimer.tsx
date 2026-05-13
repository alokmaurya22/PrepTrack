import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useStartSession, useEndSession } from '../../lib/queries/sessions'

type TimerState = 'idle' | 'running' | 'paused' | 'finished'

const SETTINGS = {
  focus: { label: 'Focus', duration: 25 * 60, color: 'text-red-500' },
  break: { label: 'Break', duration: 5 * 60, color: 'text-green-500' },
  long_break: { label: 'Long Break', duration: 15 * 60, color: 'text-blue-500' },
}

export function PomodoroTimer() {
  const startSession = useStartSession()
  const endSession = useEndSession()

  const [mode, setMode] = useState<'focus' | 'break' | 'long_break'>('focus')
  const [timeLeft, setTimeLeft] = useState(SETTINGS.focus.duration)
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const totalDuration = SETTINGS[mode].duration
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Tick
  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearTimer()
            setTimerState('finished')

            // Play sound
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

  const pause = () => {
    setTimerState('paused')
  }

  const resume = () => {
    setTimerState('running')
  }

  const endSessionAndReset = async () => {
    if (sessionId) {
      await endSession.mutateAsync({ sessionId })
    }

    if (mode === 'focus') {
      const newCount = sessionsCompleted + 1
      setSessionsCompleted(newCount)
      // After every 4 focus sessions, suggest long break
      if (newCount % 4 === 0) {
        setMode('long_break')
        setTimeLeft(SETTINGS.long_break.duration)
      } else {
        setMode('break')
        setTimeLeft(SETTINGS.break.duration)
      }
    } else {
      setMode('focus')
      setTimeLeft(SETTINGS.focus.duration)
    }

    setTimerState('idle')
    setSessionId(null)
  }

  const switchMode = (newMode: typeof mode) => {
    if (sessionId) {
      endSession.mutate({ sessionId })
    }
    setMode(newMode)
    setTimeLeft(SETTINGS[newMode].duration)
    setTimerState('idle')
    setSessionId(null)
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const config = SETTINGS[mode]

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Mode tabs */}
      <div className="flex bg-muted rounded-lg p-0.5">
        {(Object.keys(SETTINGS) as Array<keyof typeof SETTINGS>).map((key) => (
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
            {key === 'focus' && <Brain className="h-3 w-3" />}
            {key !== 'focus' && <Coffee className="h-3 w-3" />}
            {config.label}
          </button>
        ))}
      </div>

      {/* Timer circle */}
      <div className="relative w-64 h-64">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted/20"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
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
        {sessionsCompleted} focus sessions completed today
      </div>
    </div>
  )
}