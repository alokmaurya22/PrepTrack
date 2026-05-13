interface StepProps {
  data: Record<string, unknown>
  onUpdate: (d: Record<string, unknown>) => void
}

export function ExamDateStep({ data, onUpdate }: StepProps) {
  const currentValue = (data.examDate as string) || '2027-05'

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">When is your target Prelims?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          This sets the countdown and auto-generates your study roadmap. You can change it anytime.
        </p>
      </div>
      <div className="relative">
        <label htmlFor="exam-month" className="block text-sm font-medium text-foreground mb-1.5">
          Select target month and year
        </label>
        <input
          id="exam-month"
          type="month"
          defaultValue={currentValue.substring(0, 7)}
          onChange={(e) => onUpdate({ examDate: e.target.value + '-01' })}
          className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground mt-2">
          UPSC CSE Prelims is usually held in late May or early June.
        </p>
      </div>
    </div>
  )
}