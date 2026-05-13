import { GraduationCap, BookOpen, CalendarDays, BarChart2 } from 'lucide-react'

interface StepProps {
  data: Record<string, unknown>
  onUpdate: (d: Record<string, unknown>) => void
}

export function WelcomeStep({ }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Welcome to PrepTrack</h2>
        <p className="text-muted-foreground text-sm mt-2">
          Let's set up your UPSC preparation. We'll ask a few questions to personalize your experience.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted rounded-lg p-3 text-center">
          <BookOpen className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-xs text-foreground font-medium">Syllabus Tracker</p>
        </div>
        <div className="bg-muted rounded-lg p-3 text-center">
          <CalendarDays className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-xs text-foreground font-medium">Smart Planning</p>
        </div>
        <div className="bg-muted rounded-lg p-3 text-center">
          <BarChart2 className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-xs text-foreground font-medium">Deep Analytics</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        This takes about 2 minutes. You can change everything later in Settings.
      </p>
    </div>
  )
}