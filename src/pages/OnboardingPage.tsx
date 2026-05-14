import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'

// Step imports
import { WelcomeStep } from '../components/auth/onboarding/WelcomeStep'
import { ExamDateStep } from '../components/auth/onboarding/ExamDateStep'
import { OptionalSubjectStep } from '../components/auth/onboarding/OptionalSubjectStep'
import { ExamMediumStep } from '../components/auth/onboarding/ExamMediumStep'
import { StudyTargetStep } from '../components/auth/onboarding/StudyTargetStep'
import { WorkingHoursStep } from '../components/auth/onboarding/WorkingHoursStep'
import { FamiliarityStep } from '../components/auth/onboarding/FamiliarityStep'
import { generateStarterRoadmap } from '../lib/utils/generateRoadmap'

const STEPS = [
  WelcomeStep, ExamDateStep, OptionalSubjectStep, ExamMediumStep,
  StudyTargetStep, WorkingHoursStep, FamiliarityStep
]

const STEP_LABELS = [
  'Welcome', 'Exam Date', 'Optional Subject', 'Exam Medium',
  'Study Target', 'Working Hours', 'Familiarity'
]

export function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const { session } = useAuthStore()
  const navigate = useNavigate()

  const update = (patch: Record<string, unknown>) => setData(prev => ({ ...prev, ...patch }))

  const finish = async () => {
    if (!session) return
    setSaving(true)
    try {
      const { error: profileError } = await supabase.from('profiles').upsert({
        user_id: session.user.id,
        exam_attempt_date: data.examDate as string | undefined,
        optional_subject_id: data.optionalSubjectId as number | undefined,
        exam_medium_language_id: data.examMediumId as number | undefined,
        daily_target_hours: (data.dailyTargetHours as number) || 8,
        working_hours_start: (data.workStart as string) || '06:00:00',
        working_hours_end: (data.workEnd as string) || '22:00:00',
        familiarity_ratings: data.familiarityRatings as Record<string, number> | undefined,
        onboarding_completed: true,
      }, { onConflict: 'user_id' })

      if (profileError) {
        toast.error('Failed to save profile. Please try again.')
        setSaving(false)
        return
      }

      // Auto-generate roadmap phases
      const examDate = (data.examDate as string) || new Date().toISOString().split('T')[0]
      try {
        await generateStarterRoadmap(session.user.id, examDate)
      } catch {
        // Non-fatal: roadmap can be regenerated later
        toast.error('Roadmap generation skipped. You can create it later in Settings.')
      }

      navigate('/')
    } catch {
      toast.error('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  const StepComponent = STEPS[step]
  const progressPct = Math.round(((step + 1) / STEPS.length) * 100)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-8">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{STEP_LABELS[step]}</span>
            <span>{progressPct}% complete</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-card border border-border rounded-xl p-8">
          <StepComponent data={data} onUpdate={update} />

          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-4 py-2 rounded-md border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Back
              </button>
            ) : <div />}

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={saving}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Start Preparing →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}