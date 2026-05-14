import { useState, useEffect } from 'react'
import { Moon, Sun, Monitor, Search, Menu } from 'lucide-react'
import { useThemeStore, applyTheme } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'
import { NotificationBell } from '../notifications/NotificationBell'
import { SearchModal } from './SearchModal'
import { useProfile } from '../../lib/queries/profile'
import { Link } from 'react-router-dom'

interface TopbarProps {
  onMenuClick?: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { theme, setTheme } = useThemeStore()
  const { session } = useAuthStore()
  const { data: profile } = useProfile()
  const [searchOpen, setSearchOpen] = useState(false)

  const avatarUrl = profile?.avatar_url || null
  const name = profile?.full_name
    || session?.user?.user_metadata?.display_name
    || session?.user?.email?.split('@')[0]
    || ''
  const initial = (name?.[0] || session?.user?.email?.[0] || 'U').toUpperCase()

  // Listen for the keyboard shortcut event
  useEffect(() => {
    const handler = () => setSearchOpen(true)
    document.addEventListener('open-search', handler)
    return () => document.removeEventListener('open-search', handler)
  }, [])

  function cycleTheme() {
    const next = theme === 'dark' ? 'light' : theme === 'light' ? 'auto' : 'dark'
    setTheme(next)
    applyTheme(next)
  }

  return (
    <>
      <header className="h-14 border-b border-border bg-card flex items-center px-3 md:px-6 gap-3 flex-shrink-0">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search button — opens command palette */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md flex-1 max-w-sm hover:bg-muted/80 transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search…</span>
          <kbd className="ml-auto text-xs bg-background border border-border rounded px-1">/</kbd>
        </button>

        <div className="ml-auto flex items-center gap-1 md:gap-2">
          {/* Theme toggle */}
          <button
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
            onClick={cycleTheme}
            title={`Theme: ${theme}`}
          >
            {theme === 'dark'  ? <Moon className="h-4 w-4" />
             : theme === 'light' ? <Sun className="h-4 w-4" />
             : <Monitor className="h-4 w-4" />}
          </button>

          {/* Notification bell */}
          <NotificationBell />

          {/* Profile avatar — links to settings */}
          <Link
            to="/settings"
            className="h-8 w-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-border hover:ring-primary transition-all"
            title="Profile & Settings"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-primary">{initial}</span>
            )}
          </Link>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
