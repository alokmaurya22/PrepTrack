import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications, useUnreadCount, useMarkRead, useMarkAllRead } from '../../lib/queries/notifications'
import { cn } from '../../lib/utils'
import { format } from 'date-fns'

const TYPE_STYLES: Record<string, string> = {
  info: 'border-l-blue-500',
  success: 'border-l-emerald-500',
  warning: 'border-l-amber-500',
  reminder: 'border-l-purple-500',
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data: notifications } = useNotifications()
  const { data: unreadCount } = useUnreadCount()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount ? (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <h4 className="text-xs font-semibold text-foreground">
                Notifications
              </h4>
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs text-primary hover:underline"
              >
                Mark all read
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notifications && notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                notifications?.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      markRead.mutate(n.id)
                      if (n.link) window.location.hash = n.link
                    }}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors border-l-4',
                      TYPE_STYLES[n.type] || 'border-l-muted',
                      !n.is_read && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={cn('text-xs', !n.is_read ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                        )}
                      </div>
                      {!n.is_read && (
                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(n.created_at), 'MMM d, h:mm a')}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}