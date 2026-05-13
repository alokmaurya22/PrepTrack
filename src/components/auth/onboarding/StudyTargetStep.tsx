interface StepProps {
  data: Record<string, unknown>
  onUpdate: (d: Record<string, unknown>) => void
}

export function StudyTargetStep({ data, onUpdate }: StepProps) {
  const hours = (data.dailyTargetHours as number) || 8

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">How many hours can you study daily?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Be realistic — this helps plan your roadmap and daily schedule accurately.
        </p>
      </div>

      <div className="bg-muted rounded-xl p-6 text-center space-y-4">
        <div className="text-5xl font-bold text-foreground tabular-nums">{hours}</div>
        <div className="text-sm text-muted-foreground">hours per day</div>

        <div className="w-full">
          <input
            type="range"
            min={4}
            max={14}
            step={0.5}
            value={hours}
            onChange={(e) => onUpdate({ dailyTargetHours: parseFloat(e.target.value) })}
            className="w-full h-2 bg-border rounded-full appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>4 hrs</span>
            <span>8 hrs</span>
            <span>14 hrs</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className={`rounded-md p-2 ${hours <= 6 ? 'bg-primary/10 text-primary font-medium' : 'bg-muted text-muted-foreground'}`}>
          Part-time<br />4–6 hrs
        </div>
        <div className={`rounded-md p-2 ${hours > 6 && hours <= 10 ? 'bg-primary/10 text-primary font-medium' : 'bg-muted text-muted-foreground'}`}>
          Dedicated<br />7–10 hrs
        </div>
        <div className={`rounded-md p-2 ${hours > 10 ? 'bg-primary/10 text-primary font-medium' : 'bg-muted text-muted-foreground'}`}>
          Full-time<br />11–14 hrs
        </div>
      </div>
    </div>
  )
}