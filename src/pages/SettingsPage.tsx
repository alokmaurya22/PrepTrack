import { useState, useEffect } from 'react'
import { User, Bell, Palette, Shield, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useThemeStore, applyTheme } from '../store/themeStore'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { cn } from '../lib/utils'

export function SettingsPage() {
  const { signOut, session } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const [tab, setTab] = useState<'profile' | 'appearance' | 'notifications' | 'account'>('profile')

  // Profile state
  const [displayName, setDisplayName] = useState('')
  const [targetExam, setTargetExam] = useState('')
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!session) return
    supabase
      .from('profiles')
      .select('display_name, target_exam_name')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name || '')
          setTargetExam(data.target_exam_name || '')
        }
        setProfileLoaded(true)
      })
  }, [session])

  async function saveProfile() {
    if (!session || saving) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .upsert(
        { user_id: session.user.id, display_name: displayName, target_exam_name: targetExam },
        { onConflict: 'user_id' }
      )
    setSaving(false)
    if (error) toast.error(error.message)
    else toast.success('Profile saved')
  }

  const tabs = [
    { id: 'profile' as const,       label: 'Profile',       icon: User    },
    { id: 'appearance' as const,    label: 'Appearance',    icon: Palette },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell    },
    { id: 'account' as const,       label: 'Account',       icon: Shield  },
  ]

  const inputCls =
    'w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Tab sidebar */}
        <div className="w-48 border-r border-border p-3 space-y-1 flex-shrink-0">
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
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  disabled={!profileLoaded}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Target Exam</label>
                <input
                  type="text"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  placeholder="e.g. UPSC CSE, GATE, CAT, JEE, NEET…"
                  disabled={!profileLoaded}
                  className={inputCls}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Shown in your dashboard greeting
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <input
                  type="email"
                  value={session?.user?.email || ''}
                  disabled
                  className="w-full mt-1 rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Email is managed by your auth provider
                </p>
              </div>

              <button
                onClick={saveProfile}
                disabled={saving || !profileLoaded}
                className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="max-w-md space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Appearance</h2>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-2">Theme</label>
                <div className="flex gap-2">
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
                      {t === 'auto' ? 'System' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  "System" follows your OS dark/light mode preference
                </p>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="max-w-md space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
              <p className="text-xs text-muted-foreground">
                In-app notification preferences. Push notifications require browser permission.
              </p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded accent-primary" />
                  <div>
                    <span className="text-sm text-foreground">Daily study reminders</span>
                    <p className="text-xs text-muted-foreground">Get reminded to log your study hours</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded accent-primary" />
                  <div>
                    <span className="text-sm text-foreground">Revision alerts</span>
                    <p className="text-xs text-muted-foreground">Get notified when topics need revision</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded accent-primary" />
                  <div>
                    <span className="text-sm text-foreground">Exam date reminders</span>
                    <p className="text-xs text-muted-foreground">Alerts for upcoming exam calendar events</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="rounded accent-primary" />
                  <div>
                    <span className="text-sm text-foreground">Weekly progress report</span>
                    <p className="text-xs text-muted-foreground">Summary of your week's study activity</p>
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
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    Download all your notes, tasks, and progress as JSON
                  </span>
                </button>
                <button className="w-full text-left rounded-md border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                  Delete Account
                  <span className="block text-xs text-red-400 mt-0.5">
                    Permanently removes all your data. This cannot be undone.
                  </span>
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
