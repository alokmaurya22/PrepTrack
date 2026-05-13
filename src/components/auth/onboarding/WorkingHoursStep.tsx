interface StepProps {
  data: Record<string, unknown>
  onUpdate: (d: Record<string, unknown>) => void
}

function TimeSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex-1">
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  )
}

export function WorkingHoursStep({ data, onUpdate }: StepProps) {
  const workStart = (data.workStart as string) || '06:00'
  const workEnd = (data.workEnd as string) || '22:00'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">When do you study?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          This tells the planner your active study window so it won't schedule tasks during sleep hours.
        </p>
      </div>

      <div className="bg-muted rounded-xl p-6">
        <div className="flex gap-4 items-end">
          <TimeSelect
            label="Start time"
            value={workStart}
            onChange={(v) => onUpdate({ workStart: v })}
          />
          <span className="text-muted-foreground pb-2">to</span>
          <TimeSelect
            label="End time"
            value={workEnd}
            onChange={(v) => onUpdate({ workEnd: v })}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Study window: {workStart} – {workEnd}
        </p>
      </div>

      <div className="flex gap-2">
        {[
          { label: 'Early Bird', start: '05:00', end: '21:00' },
          { label: 'Standard', start: '07:00', end: '22:00' },
          { label: 'Night Owl', start: '10:00', end: '01:00' },
        ].map(preset => (
          <button
            key={preset.label}
            onClick={() => onUpdate({ workStart: preset.start, workEnd: preset.end })}
            className={`flex-1 rounded-md border px-3 py-2 text-xs transition-colors ${
              workStart === preset.start
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {preset.label}
            <br />
            <span className="opacity-70">{preset.start}–{preset.end}</span>
          </button>
        ))}
      </div>
    </div>
  )
}