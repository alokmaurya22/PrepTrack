import { PomodoroTimer } from '../components/pomodoro/PomodoroTimer'
import { SessionHistory } from '../components/pomodoro/SessionHistory'

export function PomodoroPage() {
  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      {/* Timer */}
      <div className="flex-1 flex items-center justify-center p-8">
        <PomodoroTimer />
      </div>

      {/* History sidebar */}
      <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-border bg-card/50 overflow-y-auto p-4">
        <SessionHistory />
      </div>
    </div>
  )
}