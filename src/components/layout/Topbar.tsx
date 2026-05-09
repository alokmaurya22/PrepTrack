import { Moon, Sun, Monitor, Bell, Search } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'

export function Topbar() {
  const { theme, setTheme } = useThemeStore()
  const { signOut, session } = useAuthStore()

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-6 gap-3 flex-shrink-0">
      {/* Global search placeholder */}
      <button
        id="global-search"
        className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md flex-1 max-w-sm hover:bg-muted/80"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="ml-auto text-xs bg-background border border-border rounded px-1">/</kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle */}
        <button
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
          onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'auto' : 'dark')}
        >
          {theme === 'dark' ? <Moon className="h-4 w-4" />
           : theme === 'light' ? <Sun className="h-4 w-4" />
           : <Monitor className="h-4 w-4" />}
        </button>

        {/* Notification bell placeholder */}
        <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground relative">
          <Bell className="h-4 w-4" />
        </button>

        {/* Profile */}
        <div className="relative group">
          <button className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
            {session?.user?.email?.[0]?.toUpperCase() || 'U'}
          </button>
          <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <button
              onClick={signOut}
              className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted rounded-lg"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}