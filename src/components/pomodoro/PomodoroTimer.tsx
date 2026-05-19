import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, Coffee, Brain, Settings, X, Check, Link2, Bell } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useStartSession, useEndSession } from '../../lib/queries/sessions'
import { useTasksForDate } from '../../lib/queries/tasks'
import { format } from 'date-fns'

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

// ── Web Worker code (inline blob — not throttled in background) ───────────────
const WORKER_SRC = `
var _t = null
self.onmessage = function(e) {
  if (e.data.type === 'START') {
    if (_t) clearInterval(_t)
    var end = e.data.endTime
    _t = setInterval(function() {
      var rem = Math.max(0, Math.round((end - Date.now()) / 1000))
      self.postMessage({ type: 'TICK', remaining: rem })
      if (rem <= 0) { clearInterval(_t); _t = null; self.postMessage({ type: 'DONE' }) }
    }, 500)
  } else if (e.data.type === 'STOP') {
    if (_t) clearInterval(_t)
    _t = null
  }
}
`

// ── Alarm using Web Audio API — 3 ascending beeps, repeated twice ─────────────
function playAlarm(): () => void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return () => {}
    const ctx = new Ctx()
    let active = true

    const beep = (t: number, freq: number, dur: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.6, t + 0.03)
      gain.gain.setValueAtTime(0.6, t + dur - 0.05)
      gain.gain.linearRampToValueAtTime(0, t + dur)
      osc.start(t)
      osc.stop(t + dur + 0.05)
    }

    const play = () => {
      if (!active) return
      const t = ctx.currentTime
      beep(t,        880,  0.15)
      beep(t + 0.25, 880,  0.15)
      beep(t + 0.50, 1320, 0.40)
    }

    play()
    const r1 = setTimeout(() => play(), 1600)
    const r2 = setTimeout(() => play(), 3200)

    return () => {
      active = false
      clearTimeout(r1)
      clearTimeout(r2)
      ctx.close().catch(() => {})
    }
  } catch {
    return () => {}
  }
}

function showNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/pwa-192x192.png', silent: false })
  }
}

export function PomodoroTimer() {
  const startSession = useStartSession()
  const endSession = useEndSession()

  const [durations, setDurations] = useState<Durations>(loadDurations)
  const [showSettings, setShowSettings] = useState(false)
  const [draft, setDraft] = useState<Durations>(durations)
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )

  const today = format(new Date(), 'yyyy-MM-dd')
  const { data: todayTasks } = useTasksForDate(today)
  const pendingTasks = (todayTasks || []).filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const [mode, setMode] = useState<'focus' | 'break' | 'long_break'>('focus')
  const [timeLeft, setTimeLeft] = useState(loadDurations().focus * 60)
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)

  // Wall-clock end time — for visibilitychange fallback
  const endTimeRef  = useRef<number | null>(null)
  // Web Worker — runs timer off main thread, not throttled
  const workerRef   = useRef<Worker | null>(null)
  // Stop function for current alarm
  const alarmStopRef = useRef<(() => void) | null>(null)

  const modeConfig = {
    focus:      { label: 'Focus',      duration: durations.focus * 60,      color: 'text-red-500'   },
    break:      { label: 'Break',      duration: durations.break * 60,      color: 'text-green-500' },
    long_break: { label: 'Long Break', duration: durations.long_break * 60, color: 'text-blue-500'  },
  }

  const totalDuration = modeConfig[mode].duration
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100
  const config = modeConfig[mode]

  // ── Create Web Worker on mount ─────────────────────────────────────────────
  useEffect(() => {
    const blob = new Blob([WORKER_SRC], { type: 'application/javascript' })
    const url  = URL.createObjectURL(blob)
    const worker = new Worker(url)

    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === 'TICK') {
        setTimeLeft(e.data.remaining)
      } else if (e.data.type === 'DONE') {
        setTimeLeft(0)
        setTimerState('finished')
      }
    }

    workerRef.current = worker
    return () => { worker.terminate(); URL.revokeObjectURL(url) }
  }, [])

  const stopWorker = useCallback(() => {
    workerRef.current?.postMessage({ type: 'STOP' })
    endTimeRef.current = null
  }, [])

  const stopAlarm = useCallback(() => {
    alarmStopRef.current?.()
    alarmStopRef.current = null
  }, [])

  // ── Recalculate when page becomes visible (handles phone lock / tab switch) ──
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState !== 'visible') return

      if (timerState === 'running' && endTimeRef.current) {
        const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000))
        setTimeLeft(remaining)
        if (remaining <= 0) {
          stopWorker()
          setTimerState('finished')
        }
      } else if (timerState === 'finished') {
        // Timer finished while app was in background — replay alarm on return
        stopAlarm()
        alarmStopRef.current = playAlarm()
      }
    }
    document.addEventListener('visibilitychange', handler)
    window.addEventListener('pageshow', handler)
    return () => {
      document.removeEventListener('visibilitychange', handler)
      window.removeEventListener('pageshow', handler)
    }
  }, [timerState, stopWorker, stopAlarm])

  // ── Document title countdown ───────────────────────────────────────────────
  useEffect(() => {
    if (timerState === 'running' || timerState === 'paused') {
      const m = Math.floor(timeLeft / 60)
      const s = timeLeft % 60
      document.title = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} — ${config.label} | PrepTrack`
    } else {
      document.title = 'PrepTrack'
    }
    return () => { document.title = 'PrepTrack' }
  }, [timeLeft, timerState, config.label])

  // ── Play alarm + notification when finished ────────────────────────────────
  useEffect(() => {
    if (timerState === 'finished') {
      alarmStopRef.current = playAlarm()
      const isFocus = mode === 'focus'
      showNotification(
        `${config.label} complete!`,
        isFocus ? 'Great work! Time for a break. 🎉' : "Break's over. Back to focus! 💪"
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerState])

  // ── Controls ───────────────────────────────────────────────────────────────

  async function requestNotifPermission() {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission()
      setNotifPerm(perm)
    }
  }

  const start = async () => {
    if (timerState === 'idle') {
      const session = await startSession.mutateAsync({
        session_type: mode,
        task_id: mode === 'focus' ? selectedTaskId || undefined : undefined,
      })
      setSessionId(session.id)
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(setNotifPerm)
      }
    }
    const endTime = Date.now() + timeLeft * 1000
    endTimeRef.current = endTime
    workerRef.current?.postMessage({ type: 'START', endTime })
    setTimerState('running')
  }

  const pause = () => {
    stopWorker()
    setTimerState('paused')
  }

  const resume = () => {
    const endTime = Date.now() + timeLeft * 1000
    endTimeRef.current = endTime
    workerRef.current?.postMessage({ type: 'START', endTime })
    setTimerState('running')
  }

  const endSessionAndReset = async () => {
    stopWorker()
    stopAlarm()
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
    stopWorker()
    stopAlarm()
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
    stopWorker()
    stopAlarm()
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

        {/* Notification permission button */}
        {'Notification' in window && notifPerm === 'default' && (
          <button
            onClick={requestNotifPermission}
            title="Enable notifications when timer ends"
            className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Bell className="h-4 w-4" />
          </button>
        )}

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
          {timerState === 'paused' && (
            <span className="text-xs text-amber-500 mt-1 font-medium">Paused</span>
          )}
          {timerState === 'finished' && (
            <span className="text-xs text-green-500 mt-1 font-medium animate-pulse">Time's up!</span>
          )}
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
            className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors animate-pulse"
          >
            <RotateCcw className="h-4 w-4" />
            {mode === 'focus' ? 'Take a Break' : 'Start Focus'}
          </button>
        )}
      </div>

      {/* Task link — shown only in idle focus mode */}
      {mode === 'focus' && timerState === 'idle' && pendingTasks.length > 0 && (
        <div className="w-full max-w-xs">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Link2 className="h-3 w-3" /> Link to task (optional)
          </label>
          <select
            value={selectedTaskId ?? ''}
            onChange={(e) => setSelectedTaskId(e.target.value || null)}
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">— No task —</option>
            {pendingTasks.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Session counter + notification hint */}
      <div className="flex flex-col items-center gap-1">
        <div className="text-xs text-muted-foreground">
          {sessionsCompleted} focus session{sessionsCompleted === 1 ? '' : 's'} completed today
        </div>
        {notifPerm === 'granted' && (
          <div className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
            <Bell className="h-2.5 w-2.5" /> Notifications enabled
          </div>
        )}
      </div>
    </div>
  )
}
