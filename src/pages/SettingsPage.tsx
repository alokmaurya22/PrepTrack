import { useState } from 'react'
import { User, Bell, Palette, Shield, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useThemeStore, applyTheme } from '../store/themeStore'
import { cn } from '../lib/utils'

export function SettingsPage() {
  const { signOut } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const [tab, setTab] = useState<'profile' | 'appearance' | 'notifications' | 'account'>('profile')

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'account' as const, label: 'Account', icon: Shield },
  ]

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Tab sidebar */}
        <div className="w-48 border-r border-border p-3 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                tab === t.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'profile' && (
            <div className="max-w-md space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Profile</h2>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Display Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <input
                  type="email"
                  disabled
                  className="w-full mt-1 rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>
              <button className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
                Save Changes
              </button>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="max-w-md space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Theme</label>
                <div className="flex gap-2 mt-1">
                  {(['light', 'dark', 'auto'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTheme(t)
                        applyTheme(t)
                      }}
                      className={cn(
                        'flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors capitalize',
                        theme === t
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="max-w-md space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <div>
                    <span className="text-sm text-foreground">Daily reminders</span>
                    <p className="text-xs text-muted-foreground">Get reminded to log your study hours</p>
                  </div>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <div>
                    <span className="text-sm text-foreground">Revision alerts</span>
                    <p className="text-xs text-muted-foreground">Get notified when topics need revision</p>
                  </div>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="rounded" />
                  <div>
                    <span className="text-sm text-foreground">Weekly report</span>
                    <p className="text-xs text-muted-foreground">Receive a weekly summary of your progress</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {tab === 'account' && (
            <div className="max-w-md space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Account</h2>
              <div className="space-y-3">
                <button className="w-full text-left rounded-md border border-border px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors">
                  Export My Data
                </button>
                <button className="w-full text-left rounded-md border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                  Delete Account
                </button>
                <button
                  onClick={signOut}
                  className="w-full flex items-center justify-center gap-2 rounded-md bg-muted px-4 py-3 text-sm text-foreground hover:bg-muted/70 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}