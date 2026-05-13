import { cn } from '../../lib/utils'

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', classes: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In Progress', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  completed: { label: 'Completed', classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  needs_revision: { label: 'Needs Revision', classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
}

export function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'xs' }) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.not_started
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.classes,
        size === 'xs' ? 'px-1.5 py-px text-[10px]' : 'px-2 py-0.5 text-xs'
      )}
    >
      {config.label}
    </span>
  )
}