import { useTodaySessions, type StudySession } from '../../lib/queries/sessions'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(minutes: number | null) {
  if (minutes == null) return '—'
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const SESSION_ICONS: Record<StudySession['session_type'], string> = {
  focus: '🧠',
  break: '☕',
  long_break: '🫖',
}

export function SessionHistory() {
  const { data: sessions, isLoading } = useTodaySessions()

  if (isLoading) {
    return (
      <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">
        Loading sessions…
      </div>
    )
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">No sessions recorded today</p>
        <p className="text-xs text-muted-foreground mt-1">Start a focus session above</p>
      </div>
    )
  }

  const totalFocus = sessions
    .filter((s) => s.session_type === 'focus' && s.duration_minutes)
    .reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

  const completedSessions = sessions.filter((s) => s.session_type === 'focus' && s.ended_at).length

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-foreground">{completedSessions}</div>
          <div className="text-[10px] text-muted-foreground">Sessions</div>
        </div>
        <div className="bg-muted rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-foreground">{formatDuration(totalFocus)}</div>
          <div className="text-[10px] text-muted-foreground">Focus Time</div>
        </div>
        <div className="bg-muted rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-foreground">{sessions.length}</div>
          <div className="text-[10px] text-muted-foreground">Total</div>
        </div>
      </div>

      {/* Session list */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">Today's Sessions</h4>
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center gap-3 px-3 py-2 rounded-md bg-card border border-border/50"
          >
            <span className="text-lg">{SESSION_ICONS[session.session_type]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground capitalize">
                  {session.session_type.replace('_', ' ')}
                </span>
                {session.focus_score != null && (
                  <span className="text-xs text-amber-500">
                    {'★'.repeat(session.focus_score)}{'☆'.repeat(5 - session.focus_score)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{formatTime(session.started_at)}</span>
                {session.ended_at && (
                  <>
                    <span>→</span>
                    <span>{formatTime(session.ended_at)}</span>
                  </>
                )}
                <span>·</span>
                <span>{formatDuration(session.duration_minutes)}</span>
              </div>
              {session.note && (
                <p className="text-[11px] text-muted-foreground mt-0.5 italic">"{session.note}"</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}