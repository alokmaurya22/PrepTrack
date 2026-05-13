import { useState } from 'react'
import { X } from 'lucide-react'
import { useSaveDailyLog, useDailyLog } from '../../lib/queries/dailyLogs'
import { format } from 'date-fns'
import { cn } from '../../lib/utils'

const MOODS = [
  { value: 1, emoji: '😢', label: 'Terrible' },
  { value: 2, emoji: '😐', label: 'Meh' },
  { value: 3, emoji: '🙂', label: 'Okay' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 5, emoji: '🤩', label: 'Great' },
]

const ENERGIES = [
  { value: 1, label: 'Exhausted' },
  { value: 2, label: 'Tired' },
  { value: 3, label: 'Average' },
  { value: 4, label: 'Energized' },
  { value: 5, label: 'Peak' },
]

export function EODReflection() {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const { data: existingLog } = useDailyLog(todayStr)
  const saveLog = useSaveDailyLog()

  const [open, setOpen] = useState(false)
  const [mood, setMood] = useState(existingLog?.mood || null)
  const [energy, setEnergy] = useState(existingLog?.energy || null)
  const [reflection, setReflection] = useState(existingLog?.reflection_text || '')

  const handleSave = () => {
    saveLog.mutate(
      {
        date: todayStr,
        mood: mood ?? undefined,
        energy: energy ?? undefined,
        reflection_text: reflection || undefined,
      },
      { onSuccess: () => setOpen(false) }
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        📝 End-of-Day Reflection
        {existingLog && <span className="text-emerald-500">✓ Done</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-foreground">
                Today's Reflection — {format(new Date(), 'EEEE, MMMM d')}
              </h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mood */}
            <div className="mb-5">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">How was your mood?</label>
              <div className="flex gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMood(m.value)}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors',
                      mood === m.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-[10px] text-muted-foreground">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Energy */}
            <div className="mb-5">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Energy level</label>
              <div className="flex gap-1">
                {ENERGIES.map((e) => (
                  <button
                    key={e.value}
                    onClick={() => setEnergy(e.value)}
                    className={cn(
                      'flex-1 py-2 rounded-md text-xs font-medium transition-colors border',
                      energy === e.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reflection */}
            <div className="mb-5">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Reflection notes (optional)</label>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="What went well? What could be better? Any insights?"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saveLog.isPending}
                className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saveLog.isPending ? 'Saving…' : existingLog ? 'Update Reflection' : 'Log Reflection'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}