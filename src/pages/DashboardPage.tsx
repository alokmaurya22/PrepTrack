export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome to PrepTrack. Start your UPSC journey here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Placeholder widgets */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Today's Progress</h3>
          <p className="text-3xl font-bold text-foreground mt-2">0%</p>
          <p className="text-xs text-muted-foreground mt-1">No tasks planned today</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Study Streak</h3>
          <p className="text-3xl font-bold text-foreground mt-2">0 days</p>
          <p className="text-xs text-muted-foreground mt-1">Start studying to build your streak</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Syllabus Completion</h3>
          <p className="text-3xl font-bold text-foreground mt-2">0%</p>
          <p className="text-xs text-muted-foreground mt-1">Prelims · Mains</p>
        </div>
      </div>
    </div>
  )
}