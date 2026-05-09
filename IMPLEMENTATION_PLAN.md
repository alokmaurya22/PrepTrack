# PrepTrack — Complete Phase-Wise Implementation Plan
**For:** Junior Developer  
**Stack:** React 18 + Vite + TypeScript + TailwindCSS + shadcn/ui + Supabase  
**Total Timeline:** ~36 weeks (solo junior developer)  
**DB Setup:** Done by senior developer using `database_schema.sql`

---

## Before You Start — What You Need from Senior Developer

Ask the senior developer for these values. Save them in `.env.local`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SENTRY_DSN=https://...@sentry.io/...
VITE_VAPID_PUBLIC_KEY=...
APP_URL=http://localhost:5173
```

You will **never** need or touch: service role key, OpenRouter key, Resend key, VAPID private key.

---

## Folder Structure (create this at start, stick to it)

```
preptrack/
├── src/
│   ├── components/
│   │   ├── ui/               ← shadcn/ui auto-generated components
│   │   ├── layout/           ← Sidebar, Topbar, AppShell
│   │   ├── auth/             ← Login, Signup, Onboarding wizard
│   │   ├── syllabus/         ← SyllabusTree, NodeDetail, Heatmap
│   │   ├── planner/          ← DailyView, WeeklyView, MonthlyView
│   │   ├── tasks/            ← TaskCard, TaskForm, TaskList
│   │   ├── pomodoro/         ← PomodoroTimer, SessionHistory
│   │   ├── notes/            ← NoteEditor, NoteList, NoteDetail
│   │   ├── key-notes/        ← FlashcardDeck, ReviewSession
│   │   ├── resources/        ← FileUpload, PDFViewer, ImageLightbox
│   │   ├── tests/            ← TestForm, MistakeLog, PYQTracker
│   │   ├── current-affairs/  ← CAEntry, CAList, MonthlyCompile
│   │   ├── roadmap/          ← RoadmapTimeline, PhaseBlock
│   │   ├── analytics/        ← Dashboard widgets, Charts
│   │   ├── ai/               ← AIAssistant, ChatPanel, AIBadge
│   │   ├── notifications/    ← NotificationBell, NotificationList
│   │   └── settings/         ← ProfileForm, SettingsPage
│   ├── lib/
│   │   ├── supabase.ts       ← Supabase client singleton
│   │   ├── queries/          ← React Query hooks (one file per module)
│   │   ├── mutations/        ← React Query mutations
│   │   ├── utils/            ← sm2.ts, completion.ts, productivity.ts
│   │   └── types/            ← All TypeScript interfaces from DB
│   ├── store/                ← Zustand stores
│   ├── hooks/                ← Custom React hooks
│   ├── pages/                ← Route-level components
│   └── styles/
│       └── globals.css       ← Tailwind directives + CSS variables
├── supabase/
│   └── functions/            ← Deno Edge Functions
├── public/
├── .env.local
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

---

---

# PHASE 0 — Project Bootstrap
**Duration:** Week 1 (5 days)  
**Goal:** Working skeleton app that compiles, connects to Supabase, and deploys.

---

### Step 0.1 — Install Tools (Day 1)

Install on your machine if not present:
- Node.js 20+ → https://nodejs.org
- Git → https://git-scm.com
- VS Code + extensions: ESLint, Prettier, Tailwind CSS IntelliSense, TypeScript

```bash
node --version    # should say v20+
npm --version     # should say 10+
git --version
```

---

### Step 0.2 — Create the Project (Day 1)

```bash
npm create vite@latest preptrack -- --template react-ts
cd preptrack
npm install
```

---

### Step 0.3 — Install All Dependencies (Day 1)

Run in one shot:

```bash
npm install \
  @supabase/supabase-js \
  @tanstack/react-query \
  @tanstack/react-router \
  zustand \
  tailwindcss postcss autoprefixer \
  @tailwindcss/typography \
  class-variance-authority clsx tailwind-merge \
  lucide-react \
  date-fns \
  @tiptap/react @tiptap/pm @tiptap/starter-kit \
  @tiptap/extension-placeholder @tiptap/extension-highlight \
  @tiptap/extension-task-list @tiptap/extension-task-item \
  @tiptap/extension-table @tiptap/extension-table-row \
  @tiptap/extension-table-cell @tiptap/extension-table-header \
  @tiptap/extension-image @tiptap/extension-link @tiptap/extension-color \
  @tiptap/extension-text-style @tiptap/extension-underline \
  @tiptap/extension-strike @tiptap/extension-character-count \
  katex \
  react-pdf \
  dompurify \
  recharts \
  react-beautiful-dnd \
  @hello-pangea/dnd \
  sonner \
  @sentry/react \
  react-hook-form \
  @hookform/resolvers \
  zod \
  rrule \
  web-push

npm install -D \
  @types/dompurify \
  @types/katex \
  @types/react-beautiful-dnd \
  vitest @vitejs/plugin-react \
  eslint @typescript-eslint/eslint-plugin \
  prettier prettier-plugin-tailwindcss
```

---

### Step 0.4 — Configure Tailwind (Day 1)

```bash
npx tailwindcss init -p
```

Replace `tailwind.config.ts` with:

```ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config
```

Replace `src/styles/globals.css` with:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light Theme */
    --background:         0 0% 98%;
    --foreground:         222 47% 11%;
    --card:               0 0% 100%;
    --card-foreground:    222 47% 11%;
    --border:             214 32% 91%;
    --input:              214 32% 91%;
    --primary:            243 75% 59%;    /* indigo-500 */
    --primary-foreground: 0 0% 100%;
    --secondary:          210 40% 96%;
    --secondary-foreground: 222 47% 11%;
    --muted:              210 40% 96%;
    --muted-foreground:   215 16% 47%;
    --accent:             210 40% 96%;
    --accent-foreground:  222 47% 11%;
    --destructive:        0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --ring:               243 75% 59%;
    --radius:             0.5rem;
  }

  .dark {
    /* Dark Theme — dark slate, NOT pure black */
    --background:         222 18% 7%;    /* #0F1115 */
    --foreground:         210 20% 92%;
    --card:               222 16% 10%;
    --card-foreground:    210 20% 92%;
    --border:             222 16% 18%;
    --input:              222 16% 18%;
    --primary:            243 75% 65%;
    --primary-foreground: 0 0% 100%;
    --secondary:          222 16% 14%;
    --secondary-foreground: 210 20% 92%;
    --muted:              222 16% 14%;
    --muted-foreground:   215 16% 57%;
    --accent:             222 16% 14%;
    --accent-foreground:  210 20% 92%;
    --destructive:        0 62% 50%;
    --destructive-foreground: 0 0% 100%;
    --ring:               243 75% 65%;
  }
}

@layer base {
  * { @apply border-border; }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

---

### Step 0.5 — Setup shadcn/ui (Day 2)

```bash
npx shadcn-ui@latest init
```

When prompted:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

Then add all components you'll need (run once):

```bash
npx shadcn-ui@latest add button input label textarea select \
  card dialog sheet popover dropdown-menu tooltip \
  command separator skeleton badge avatar \
  progress slider switch tabs scroll-area \
  form alert toast calendar
```

---

### Step 0.6 — Supabase Client (Day 2)

Create `src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase env vars. Check .env.local')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: true,
  },
})
```

Create `src/lib/types/database.ts` — this is a big file. Generate it automatically:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/types/database.ts
```

Replace `YOUR_PROJECT_ID` with the ID from your Supabase project URL.

---

### Step 0.7 — React Query + Zustand Setup (Day 2)

Edit `src/main.tsx`:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 min
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)
```

---

### Step 0.8 — Basic Routing Shell (Day 3)

Install router:
```bash
npm install react-router-dom
```

Create `src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { AppShell } from './components/layout/AppShell'
import { AuthPage } from './pages/AuthPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { DashboardPage } from './pages/DashboardPage'

export default function App() {
  const { session, loading } = useAuthStore()

  if (loading) return <div className="h-screen flex items-center justify-center text-muted-foreground">Loading...</div>

  if (!session) return <AuthPage />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          {/* More routes added in later phases */}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

Create `src/store/authStore.ts`:

```ts
import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  session: Session | null
  loading: boolean
  setSession: (session: Session | null) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize from existing session
  supabase.auth.getSession().then(({ data }) => {
    set({ session: data.session, loading: false })
  })

  // Listen for auth state changes
  supabase.auth.onAuthStateChange((_event, session) => {
    set({ session, loading: false })
  })

  return {
    session: null,
    loading: true,
    setSession: (session) => set({ session }),
    signOut: async () => {
      await supabase.auth.signOut()
      set({ session: null })
    },
  }
})
```

---

### Step 0.9 — GitHub + Vercel (Day 4-5)

```bash
git init
git add .
git commit -m "feat: project bootstrap"
```

Create repo on GitHub, push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/preptrack.git
git push -u origin main
```

Deploy to Vercel:
1. Go to vercel.com → New Project → import your GitHub repo
2. Framework: **Vite**
3. Add all env vars from `.env.local`
4. Deploy

**Phase 0 Done ✓** — App builds, deploys, Supabase client initializes.

---

---

# PHASE 1 — Design System & Layout
**Duration:** Week 2 (5 days)  
**Goal:** Complete app shell with sidebar, topbar, theme toggle. Nothing functional yet — just the skeleton that looks great.

---

### Step 1.1 — App Shell Layout (Day 6-7)

Create `src/components/layout/AppShell.tsx`:

```tsx
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

---

### Step 1.2 — Sidebar (Day 6-7)

Create `src/components/layout/Sidebar.tsx`:

```tsx
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, BookOpen, FileText,
  FolderOpen, ClipboardList, Newspaper, BarChart2,
  Sparkles, Settings, GraduationCap
} from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/',               icon: LayoutDashboard, label: 'Dashboard'      },
  { to: '/plan',           icon: CalendarDays,    label: 'Planner'        },
  { to: '/syllabus',       icon: BookOpen,        label: 'Syllabus'       },
  { to: '/notes',          icon: FileText,        label: 'Notes'          },
  { to: '/resources',      icon: FolderOpen,      label: 'Resources'      },
  { to: '/tests',          icon: ClipboardList,   label: 'Tests & PYQs'  },
  { to: '/current-affairs',icon: Newspaper,       label: 'Current Affairs'},
  { to: '/analytics',      icon: BarChart2,       label: 'Analytics'      },
  { to: '/ai',             icon: Sparkles,        label: 'AI Assistant'   },
  { to: '/settings',       icon: Settings,        label: 'Settings'       },
]

export function Sidebar() {
  return (
    <aside className="w-60 flex-shrink-0 border-r border-border bg-card flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-border gap-2">
        <GraduationCap className="h-5 w-5 text-primary" />
        <span className="font-semibold tracking-tight text-foreground">PrepTrack</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
```

---

### Step 1.3 — Topbar with Theme Toggle (Day 8)

Create `src/store/themeStore.ts`:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeState {
  theme: Theme
  setTheme: (t: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'auto',
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
    }),
    { name: 'preptrack-theme' }
  )
)

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    // auto — follow OS
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  }
}
```

Create `src/components/layout/Topbar.tsx`:

```tsx
import { Moon, Sun, Monitor, Bell, Search } from 'lucide-react'
import { Button } from '../ui/button'
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

export function Topbar() {
  const { theme, setTheme } = useThemeStore()
  const { signOut, session } = useAuthStore()

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-6 gap-3 flex-shrink-0">
      {/* Global search (placeholder — wired in Phase 6) */}
      <button
        className="flex items-center gap-2 text-sm text-muted-foreground
          bg-muted px-3 py-1.5 rounded-md flex-1 max-w-sm hover:bg-muted/80"
        onClick={() => {/* open search modal */}}
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="ml-auto text-xs bg-background border border-border rounded px-1">/</kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {theme === 'dark' ? <Moon className="h-4 w-4" />
               : theme === 'light' ? <Sun className="h-4 w-4" />
               : <Monitor className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="h-4 w-4 mr-2" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="h-4 w-4 mr-2" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('auto')}>
              <Monitor className="h-4 w-4 mr-2" /> Auto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notification bell (wired in Phase 14) */}
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
        </Button>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {session?.user?.email?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
```

---

### Step 1.4 — Shared Empty State & Loading Components (Day 9)

Create `src/components/ui/empty-state.tsx`:

```tsx
import { LucideIcon } from 'lucide-react'
import { Button } from './button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  )
}
```

Create `src/components/ui/skeleton-list.tsx`:

```tsx
import { Skeleton } from './skeleton'

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-md" />
      ))}
    </div>
  )
}
```

---

### Step 1.5 — Add `cn` utility (Day 9)

Create `src/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

### Step 1.6 — Keyboard Shortcuts (Day 10)

Create `src/hooks/useKeyboardShortcuts.ts`:

```ts
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    let lastKey = ''

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return

      if (e.key === '/') {
        e.preventDefault()
        document.getElementById('global-search')?.focus()
        return
      }

      if (e.key === 'c' && lastKey !== 'g') {
        // 'c' = create task (wired in Phase 4)
      }

      if (lastKey === 'g') {
        const routes: Record<string, string> = {
          d: '/', p: '/plan', s: '/syllabus',
          n: '/notes', a: '/analytics',
        }
        if (routes[e.key]) navigate(routes[e.key])
      }

      lastKey = e.key
      setTimeout(() => { lastKey = '' }, 1000)
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])
}
```

Call this in AppShell: `useKeyboardShortcuts()`

---

### Step 1.7 — Toasts (Day 10)

In `src/main.tsx` add `<Toaster />` from sonner:

```tsx
import { Toaster } from 'sonner'
// Inside ReactDOM.render, after QueryClientProvider:
<Toaster richColors position="top-right" />
```

Use toasts anywhere like:
```ts
import { toast } from 'sonner'
toast.success('Task saved')
toast.error('Something went wrong')
```

---

**Phase 1 Done ✓** — App has professional sidebar + topbar, light/dark themes work, empty pages render correctly.

---

---

# PHASE 2 — Authentication & Onboarding
**Duration:** Weeks 3–4 (10 days)  
**Goal:** Users can sign up, verify email, log in (email + Google), and complete the 7-step onboarding wizard.

---

### Step 2.1 — Enable Google OAuth in Supabase (Day 11)

1. Go to Supabase Dashboard → Authentication → Providers → Google
2. Enable it, add your Google OAuth Client ID + Secret
3. Add callback URL from Supabase to your Google Cloud Console

---

### Step 2.2 — Auth Page (Login + Signup) (Day 11-12)

Create `src/pages/AuthPage.tsx`:

```tsx
import { useState } from 'react'
import { GraduationCap } from 'lucide-react'
import { LoginForm } from '../components/auth/LoginForm'
import { SignupForm } from '../components/auth/SignupForm'
import { Button } from '../components/ui/button'

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 bg-primary/5 flex-col justify-center px-16 gap-6 border-r border-border">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold tracking-tight">PrepTrack</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground leading-tight">
          Your UPSC preparation,<br />organized in one place.
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Track your syllabus, plan daily study, log tests, manage notes,
          and get AI-assisted insights — all built for the seriousness of CSE.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {['Syllabus Tracker','Spaced Repetition','Test Analytics','AI Assistant'].map(f => (
            <div key={f} className="bg-card border border-border rounded-lg p-3 text-sm font-medium text-foreground">
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-foreground">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {mode === 'login' ? 'Sign in to continue your UPSC journey' : 'Start tracking your preparation today'}
            </p>
          </div>

          {mode === 'login' ? <LoginForm /> : <SignupForm />}

          <p className="text-center text-sm text-muted-foreground">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <Button variant="link" className="p-0 h-auto" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
```

Create `src/components/auth/LoginForm.tsx`:

```tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { toast } from 'sonner'

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
})

type FormData = z.infer<typeof schema>

export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) toast.error(error.message)
    setLoading(false)
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Button type="button" variant="outline" className="w-full" onClick={signInWithGoogle}>
        <img src="/google.svg" className="h-4 w-4 mr-2" alt="" />
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...register('password')} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
```

Create `src/components/auth/SignupForm.tsx` — same structure as LoginForm but call `supabase.auth.signUp()` and show "check your email" message after success.

---

### Step 2.3 — Password Reset (Day 13)

Add a "Forgot password?" link in LoginForm.  
On click, show email input and call:

```ts
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`
})
toast.success('Check your email for a password reset link')
```

Create `src/pages/ResetPasswordPage.tsx` — reads the token from URL, shows new password form, calls `supabase.auth.updateUser({ password: newPassword })`.

---

### Step 2.4 — Onboarding Wizard (Day 14-18)

The wizard is shown to users who have `onboarding_completed = false` in their profile.

Create `src/pages/OnboardingPage.tsx` as a wizard with 7 steps:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'

// Import step components (create each separately)
import { WelcomeStep }          from '../components/auth/onboarding/WelcomeStep'
import { ExamDateStep }         from '../components/auth/onboarding/ExamDateStep'
import { OptionalSubjectStep }  from '../components/auth/onboarding/OptionalSubjectStep'
import { ExamMediumStep }       from '../components/auth/onboarding/ExamMediumStep'
import { StudyTargetStep }      from '../components/auth/onboarding/StudyTargetStep'
import { WorkingHoursStep }     from '../components/auth/onboarding/WorkingHoursStep'
import { FamiliarityStep }      from '../components/auth/onboarding/FamiliarityStep'

const STEPS = [
  WelcomeStep, ExamDateStep, OptionalSubjectStep, ExamMediumStep,
  StudyTargetStep, WorkingHoursStep, FamiliarityStep
]

export function OnboardingPage() {
  const [step, setStep]       = useState(0)
  const [data, setData]       = useState<Record<string, unknown>>({})
  const [saving, setSaving]   = useState(false)
  const { session }           = useAuthStore()
  const navigate              = useNavigate()

  const update = (patch: Record<string, unknown>) => setData(prev => ({ ...prev, ...patch }))

  const finish = async () => {
    if (!session) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      exam_attempt_date:       data.examDate,
      optional_subject_id:     data.optionalSubjectId,
      exam_medium_language_id: data.examMediumId,
      daily_target_hours:      data.dailyTargetHours,
      working_hours_start:     data.workStart,
      working_hours_end:       data.workEnd,
      familiarity_ratings:     data.familiarityRatings,
      onboarding_completed:    true,
    }).eq('user_id', session.user.id)

    if (error) { toast.error('Failed to save. Please try again.'); setSaving(false); return }

    // Auto-generate roadmap phases (see Phase 4)
    await generateStarterRoadmap(session.user.id, data.examDate as string)

    navigate('/')
  }

  const StepComponent = STEPS[step]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-8">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{Math.round(((step + 1) / STEPS.length) * 100)}% complete</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-card border border-border rounded-xl p-8">
          <StepComponent data={data} onUpdate={update} />

          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}>Back</Button>
            ) : <div />}

            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)}>Continue</Button>
            ) : (
              <Button onClick={finish} disabled={saving}>
                {saving ? 'Saving…' : 'Start Preparing →'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Each step is a simple form component.** Example `ExamDateStep.tsx`:

```tsx
interface StepProps { data: Record<string, unknown>; onUpdate: (d: Record<string, unknown>) => void }

export function ExamDateStep({ data, onUpdate }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">When is your target Prelims?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          This sets the countdown and auto-generates your study roadmap.
        </p>
      </div>
      <input
        type="month"
        className="w-full border border-input rounded-md px-3 py-2 bg-background"
        defaultValue={data.examDate as string || '2026-05'}
        onChange={(e) => onUpdate({ examDate: e.target.value + '-01' })}
      />
    </div>
  )
}
```

Follow the same pattern for all 7 steps. Step 3 (OptionalSubjectStep) fetches from `optional_subjects` table. Step 4 (ExamMediumStep) fetches from `exam_languages`. Step 5 uses a slider (4–14 hrs). Step 6 uses two time pickers. Step 7 shows top-level subjects with 1–5 star ratings.

---

### Step 2.5 — Redirect Logic (Day 19)

In `App.tsx`, after auth check, also check `onboarding_completed`:

```tsx
const { data: profile } = await supabase
  .from('profiles')
  .select('onboarding_completed')
  .eq('user_id', session.user.id)
  .single()

if (!profile?.onboarding_completed) return <Navigate to="/onboarding" />
```

---

### Step 2.6 — Auto-generate Starter Roadmap (Day 20)

Create `src/lib/utils/generateRoadmap.ts`:

```ts
import { supabase } from '../supabase'
import { addDays, addMonths, parseISO } from 'date-fns'

export async function generateStarterRoadmap(userId: string, examDateStr: string) {
  const examDate = parseISO(examDateStr)
  const today    = new Date()
  const daysLeft = Math.floor((examDate.getTime() - today.getTime()) / 86400000)

  // Distribute phases proportionally
  const phases = [
    { name: 'Foundation',          type: 'foundation',    pct: 0.30 },
    { name: 'Consolidation',       type: 'consolidation', pct: 0.20 },
    { name: 'Revision Round 1',    type: 'revision_1',    pct: 0.15 },
    { name: 'Revision Round 2',    type: 'revision_2',    pct: 0.10 },
    { name: 'Test Series',         type: 'test_series',   pct: 0.15 },
    { name: 'Final 60 Days',       type: 'final_60',      pct: 0.10 },
  ]

  let cursor = today
  const rows = phases.map(p => {
    const days   = Math.floor(daysLeft * p.pct)
    const start  = cursor
    const end    = addDays(cursor, days - 1)
    cursor = addDays(end, 1)
    return {
      user_id:    userId,
      name:       p.name,
      phase_type: p.type,
      start_date: start.toISOString().split('T')[0],
      end_date:   end.toISOString().split('T')[0],
      sort_order: phases.indexOf(p),
    }
  })

  await supabase.from('roadmap_phases').insert(rows)
}
```

---

**Phase 2 Done ✓** — Multiple students can sign up, verify email, log in, complete onboarding, and land on dashboard.

---

---

# PHASE 3 — Syllabus Management
**Duration:** Weeks 5–7 (15 days)  
**Goal:** Full UPSC syllabus tree, per-node status & confidence tracking, search/filter, completion percentages.

---

### Step 3.1 — Seed the Syllabus (Day 21-24)

The syllabus has ~8000 nodes. Seed via a Node.js script using the service-role key (senior dev runs this once).

Create `scripts/seed-syllabus.ts` (senior dev runs this):

```ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Structure: [{ code, parent_code, level, title, stage, default_hours, is_leaf }]
const syllabusData = [
  // Stage: Prelims
  { code: 'prelims',    parent_code: null,    level: 1, title: 'Prelims',         stage: 'prelims', is_leaf: false, default_hours: 0 },
  { code: 'pre_gs1',   parent_code: 'prelims', level: 2, title: 'General Studies Paper 1', stage: 'prelims', is_leaf: false, default_hours: 0 },
  { code: 'pre_csat',  parent_code: 'prelims', level: 2, title: 'CSAT (Paper 2)', stage: 'prelims', is_leaf: false, default_hours: 0 },

  // GS Paper 1 → Subjects
  { code: 'pre_gs1_history',  parent_code: 'pre_gs1', level: 3, title: 'History & Indian National Movement', stage: 'prelims', is_leaf: false, default_hours: 0 },
  { code: 'pre_gs1_geography',parent_code: 'pre_gs1', level: 3, title: 'Geography', stage: 'prelims', is_leaf: false, default_hours: 0 },
  { code: 'pre_gs1_polity',   parent_code: 'pre_gs1', level: 3, title: 'Indian Polity & Governance', stage: 'prelims', is_leaf: false, default_hours: 0 },
  { code: 'pre_gs1_economy',  parent_code: 'pre_gs1', level: 3, title: 'Economic & Social Development', stage: 'prelims', is_leaf: false, default_hours: 0 },
  { code: 'pre_gs1_env',      parent_code: 'pre_gs1', level: 3, title: 'Environment & Ecology', stage: 'prelims', is_leaf: false, default_hours: 0 },
  { code: 'pre_gs1_science',  parent_code: 'pre_gs1', level: 3, title: 'General Science & Technology', stage: 'prelims', is_leaf: false, default_hours: 0 },
  { code: 'pre_gs1_ca',       parent_code: 'pre_gs1', level: 3, title: 'Current Events', stage: 'prelims', is_leaf: false, default_hours: 0 },

  // History → Topics (add hundreds more following same pattern)
  { code: 'pre_gs1_history_ancient',  parent_code: 'pre_gs1_history', level: 4, title: 'Ancient India', stage: 'prelims', is_leaf: false, default_hours: 0 },
  { code: 'pre_gs1_history_medieval', parent_code: 'pre_gs1_history', level: 4, title: 'Medieval India', stage: 'prelims', is_leaf: false, default_hours: 0 },
  { code: 'pre_gs1_history_modern',   parent_code: 'pre_gs1_history', level: 4, title: 'Modern India', stage: 'prelims', is_leaf: false, default_hours: 0 },
  { code: 'pre_gs1_history_art',      parent_code: 'pre_gs1_history', level: 4, title: 'Art & Culture', stage: 'prelims', is_leaf: false, default_hours: 0 },

  // Sub-topics (leaves) — example
  { code: 'pre_gs1_h_ancient_indus', parent_code: 'pre_gs1_history_ancient', level: 5, title: 'Indus Valley Civilization', stage: 'prelims', is_leaf: true, default_hours: 2.5 },
  { code: 'pre_gs1_h_ancient_vedic', parent_code: 'pre_gs1_history_ancient', level: 5, title: 'Vedic Period', stage: 'prelims', is_leaf: true, default_hours: 2.0 },
  // ... add ~8000 nodes total following official UPSC syllabus PDF
]
```

> **IMPORTANT NOTE FOR JUNIOR DEVELOPER:** The full seed data file must reference the official UPSC CSE notification. Request the PDF from the product owner. The senior developer will run this seed script once. You (junior dev) just need the database to be already seeded before Phase 3 frontend work.

---

### Step 3.2 — Syllabus React Query Hooks (Day 24)

Create `src/lib/queries/syllabus.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuthStore } from '../../store/authStore'

export function useSyllabusNodes(parentId: string | null = null) {
  return useQuery({
    queryKey: ['syllabus', parentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('syllabus_nodes')
        .select('*')
        .eq('parent_id', parentId ?? '')
        .order('sort_order')
      if (error) throw error
      return data
    },
  })
}

export function useUserProgress() {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['syllabus-progress', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_syllabus_progress')
        .select('*')
        .eq('user_id', session!.user.id)
      if (error) throw error
      // Return as a map keyed by syllabus_node_id
      return Object.fromEntries(data.map(r => [r.syllabus_node_id, r]))
    },
  })
}

export function useUpdateProgress() {
  const { session } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { nodeId: string; status: string; confidence?: number }) => {
      const { error } = await supabase
        .from('user_syllabus_progress')
        .upsert({
          user_id:          session!.user.id,
          syllabus_node_id: vars.nodeId,
          status:           vars.status,
          confidence_rating: vars.confidence,
          completed_at:     vars.status === 'completed' ? new Date().toISOString() : null,
          // Auto-schedule first revision in 1 day if just completed
          next_revision_at: vars.status === 'completed'
            ? new Date(Date.now() + 86400000).toISOString()
            : undefined,
        }, { onConflict: 'user_id,syllabus_node_id' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['syllabus-progress'] }),
  })
}
```

---

### Step 3.3 — Syllabus Tree Component (Day 25-28)

Create `src/components/syllabus/SyllabusTree.tsx` — a recursive expandable tree.

Key points:
- Use `react-window` for virtualization (install: `npm install react-window @types/react-window`)
- Each node shows: title, status badge, confidence stars, completion %
- Clicking a node opens `NodeDetailPanel` as a sheet
- Status can be changed inline with a dropdown

```tsx
import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { useSyllabusNodes, useUserProgress } from '../../lib/queries/syllabus'
import { StatusBadge } from './StatusBadge'
import { ConfidenceStars } from './ConfidenceStars'

interface SyllabusNodeRowProps {
  nodeId: string
  level: number
  title: string
  isLeaf: boolean
  onSelect: (id: string) => void
}

export function SyllabusNodeRow({ nodeId, level, title, isLeaf, onSelect }: SyllabusNodeRowProps) {
  const [expanded, setExpanded] = useState(false)
  const { data: progress } = useUserProgress()
  const nodeProgress = progress?.[nodeId]

  const { data: children } = useSyllabusNodes(expanded && !isLeaf ? nodeId : null)

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-md cursor-pointer group"
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={() => isLeaf ? onSelect(nodeId) : setExpanded(e => !e)}
      >
        {!isLeaf && (
          <span className="text-muted-foreground w-4">
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </span>
        )}
        <span className="text-sm flex-1 text-foreground">{title}</span>
        {isLeaf && nodeProgress && (
          <>
            <StatusBadge status={nodeProgress.status} />
            <ConfidenceStars value={nodeProgress.confidence_rating} />
          </>
        )}
      </div>

      {expanded && children?.map(child => (
        <SyllabusNodeRow
          key={child.id}
          nodeId={child.id}
          level={level + 1}
          title={child.title}
          isLeaf={child.is_leaf}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
```

---

### Step 3.4 — Completion Percentage Computation (Day 29)

Create `src/lib/utils/completion.ts`:

```ts
// Given all progress records, compute completion % for any node
// by looking at all leaf descendants
export function computeCompletion(
  nodeId: string,
  allNodes: Record<string, { id: string; parent_id: string | null; is_leaf: boolean }>,
  progressMap: Record<string, { status: string }>
): number {
  const leaves = getLeafDescendants(nodeId, allNodes)
  if (leaves.length === 0) return 0
  const done = leaves.filter(id =>
    progressMap[id]?.status === 'completed' ||
    progressMap[id]?.status === 'needs_revision'
  ).length
  return Math.round((done / leaves.length) * 100)
}

function getLeafDescendants(
  nodeId: string,
  allNodes: Record<string, { id: string; parent_id: string | null; is_leaf: boolean }>
): string[] {
  const node = allNodes[nodeId]
  if (!node) return []
  if (node.is_leaf) return [nodeId]
  const children = Object.values(allNodes).filter(n => n.parent_id === nodeId)
  return children.flatMap(c => getLeafDescendants(c.id, allNodes))
}
```

---

### Step 3.5 — Node Detail Panel (Day 30-32)

`NodeDetailPanel` opens as a shadcn `Sheet` when any leaf node is clicked.  
It shows:
- Title, description
- Status dropdown (Not Started / In Progress / Completed / Needs Revision)
- Confidence stars (1-5)
- Estimated hours (system default + user override)
- Source mapping (list of books/videos/URLs, add/edit/delete)
- Linked notes (list with link to note)
- Revision history
- Attachments count

This is the most complex component in this phase. Build it incrementally — status + confidence first, then sources, then rest.

---

### Step 3.6 — Syllabus Page (Day 33-34)

Create `src/pages/SyllabusPage.tsx`:

```tsx
import { useState } from 'react'
import { Input } from '../components/ui/input'
import { Search, Filter } from 'lucide-react'
import { SyllabusNodeRow } from '../components/syllabus/SyllabusTree'
import { NodeDetailPanel } from '../components/syllabus/NodeDetailPanel'
import { useSyllabusNodes } from '../lib/queries/syllabus'

export function SyllabusPage() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const { data: rootNodes } = useSyllabusNodes(null)

  return (
    <div className="flex h-full gap-4">
      {/* Tree panel */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search syllabus…"
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3 flex-1 overflow-y-auto">
          {rootNodes?.map(node => (
            <SyllabusNodeRow
              key={node.id}
              nodeId={node.id}
              level={0}
              title={node.title}
              isLeaf={node.is_leaf}
              onSelect={setSelectedNode}
            />
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selectedNode && (
        <NodeDetailPanel
          nodeId={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  )
}
```

---

**Phase 3 Done ✓** — Users can browse full UPSC syllabus tree, mark topics, set confidence, add sources, and see completion percentages.

---

---

# PHASE 4 — Study Planner & Task Management
**Duration:** Weeks 8–11 (20 days)  
**Goal:** Daily/Weekly/Monthly planner with drag-and-drop, full task CRUD, recurring tasks.

---

### Step 4.1 — Task Types & Zod Schemas (Day 39)

Create `src/lib/types/tasks.ts`:

```ts
export const TASK_TYPES = ['syllabus','revision','test_pyq','answer_writing','current_affairs','custom'] as const
export const TASK_STATUSES = ['pending','in_progress','completed','partial','skipped','cancelled'] as const
export const TASK_PRIORITIES = ['p1','p2','p3'] as const

export type TaskType = typeof TASK_TYPES[number]
export type TaskStatus = typeof TASK_STATUSES[number]
```

Create `src/lib/queries/tasks.ts` with hooks:
- `useTasks(date: string)` — fetch tasks for a specific date
- `useWeekTasks(weekStart: string)` — fetch tasks for 7 days
- `useCreateTask()` — mutation
- `useUpdateTask()` — mutation
- `useDeleteTask()` — mutation

---

### Step 4.2 — Task Form (Day 40-41)

Create `src/components/tasks/TaskForm.tsx` — a dialog form with fields:
- Title (required)
- Type (select)
- Date picker
- Time block (start/end time)
- Estimated minutes
- Priority (P1/P2/P3 chips)
- Link to syllabus node (searchable select)
- Recurrence rule (none/daily/weekdays/weekly/monthly)
- Reminder time

---

### Step 4.3 — Daily Planner View (Day 42-45)

Create `src/pages/PlannerPage.tsx` with tabs: Daily / Weekly / Monthly

**Daily View:**
- Time-blocked task list (06:00 → 22:00, hourly rows)
- Drag-and-drop reordering using `@hello-pangea/dnd`
- Quick-add input at top
- Each task card shows: title, type badge, estimated time, status toggle
- Mark complete/partial/skipped with one click
- Today's total hours vs target progress bar

```tsx
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { useTasks, useUpdateTask } from '../../lib/queries/tasks'
import { TaskCard } from './TaskCard'

// In render:
<DragDropContext onDragEnd={handleDragEnd}>
  <Droppable droppableId="daily-tasks">
    {(provided) => (
      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1.5">
        {tasks?.map((task, index) => (
          <Draggable key={task.id} draggableId={task.id} index={index}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                <TaskCard task={task} />
              </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
</DragDropContext>
```

---

### Step 4.4 — Weekly View (Day 45-47)

7-column grid. Each column = one day. Show task count + completion chip per day.  
Click a day → shows that day's task list in a side panel.  
Weekly goals editable at top (stored in `goals` table).

---

### Step 4.5 — Monthly Calendar View (Day 48-50)

Use a custom calendar grid (no external library needed — just CSS grid).  
Each day cell shows: dot indicators for task count, milestone markers.  
Click any day → drawer with that day's tasks.

---

### Step 4.6 — Recurring Tasks (Day 51-52)

When creating a task with a recurrence rule:
1. Save the task with `recurrence_rule` set (iCal RRULE string)
2. On each calendar page load, generate future instances client-side using the `rrule` package:

```ts
import { RRule } from 'rrule'

function generateRecurringInstances(task: Task, rangeStart: Date, rangeEnd: Date) {
  if (!task.recurrence_rule) return []
  const rule = RRule.fromString(task.recurrence_rule)
  return rule.between(rangeStart, rangeEnd).map(date => ({
    ...task,
    target_date: date.toISOString().split('T')[0],
    id: `${task.id}_${date.getTime()}`, // virtual ID
  }))
}
```

---

### Step 4.7 — End-of-Day Reflection (Day 53)

Show a dialog at 10 PM (configurable) or when user clicks "End Day":
- Summary: X of Y tasks completed
- Mood slider 1-5
- Energy slider 1-5  
- Free text reflection
- Save to `daily_logs` table

---

**Phase 4 Done ✓** — Full daily/weekly/monthly planning, drag-and-drop, recurring tasks, end-of-day reflection.

---

---

# PHASE 5 — Pomodoro & Study Sessions
**Duration:** Week 12 (5 days)  
**Goal:** Built-in focus timer that logs sessions and feeds analytics.

---

### Step 5.1 — Pomodoro Timer Store (Day 56)

Create `src/store/pomodoroStore.ts`:

```ts
import { create } from 'zustand'

type Phase = 'focus' | 'break' | 'long_break' | 'idle'

interface PomodoroState {
  phase:            Phase
  secondsLeft:      number
  cyclesCompleted:  number
  taskId:           string | null
  isRunning:        boolean
  settings: { focus: number; shortBreak: number; longBreak: number; cyclesBeforeLong: number }
  start:   (taskId?: string) => void
  pause:   () => void
  resume:  () => void
  skip:    () => void
  abandon: () => void
  tick:    () => void
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  phase:           'idle',
  secondsLeft:     25 * 60,
  cyclesCompleted: 0,
  taskId:          null,
  isRunning:       false,
  settings: { focus: 25, shortBreak: 5, longBreak: 15, cyclesBeforeLong: 4 },

  start: (taskId) => set(s => ({
    phase: 'focus',
    secondsLeft: s.settings.focus * 60,
    isRunning: true,
    taskId: taskId ?? null,
  })),

  pause:   () => set({ isRunning: false }),
  resume:  () => set({ isRunning: true }),
  abandon: () => set({ phase: 'idle', isRunning: false, secondsLeft: get().settings.focus * 60 }),

  skip: () => {
    const s = get()
    const next = s.phase === 'focus' ? (
      s.cyclesCompleted + 1 >= s.settings.cyclesBeforeLong ? 'long_break' : 'break'
    ) : 'focus'
    set({
      phase: next,
      secondsLeft: (next === 'focus' ? s.settings.focus : next === 'long_break' ? s.settings.longBreak : s.settings.shortBreak) * 60,
      cyclesCompleted: next === 'focus' ? s.cyclesCompleted + 1 : s.cyclesCompleted,
      isRunning: true,
    })
  },

  tick: () => {
    const s = get()
    if (!s.isRunning || s.secondsLeft <= 0) return
    if (s.secondsLeft === 1) { get().skip(); return }
    set({ secondsLeft: s.secondsLeft - 1 })
  },
}))
```

---

### Step 5.2 — Timer Component (Day 57-58)

Create `src/components/pomodoro/PomodoroTimer.tsx`:

- Large circular progress ring (SVG)
- MM:SS countdown display
- Phase label (Focus / Short Break / Long Break)
- Start/Pause/Skip/Abandon buttons
- Task selector dropdown
- Keyboard shortcut: Space = pause/resume

Use `setInterval` in a `useEffect` to call `tick()` every second:

```ts
useEffect(() => {
  const interval = setInterval(() => tick(), 1000)
  return () => clearInterval(interval)
}, [tick])
```

---

### Step 5.3 — Save Sessions to DB (Day 59)

When a focus phase ends (or is abandoned), save to `study_sessions`:

```ts
await supabase.from('study_sessions').insert({
  user_id:          session.user.id,
  task_id:          taskId,
  started_at:       startedAt.toISOString(),
  ended_at:         new Date().toISOString(),
  duration_minutes: durationMinutes,
  session_type:     'focus',
})
```

After saving, show session-end prompt dialog: focus rating 1-5 + optional note.

---

### Step 5.4 — Pomodoro Widget on Sidebar (Day 60)

Add a mini pomodoro widget at the bottom of the sidebar showing:
- Current phase + time remaining
- Click to expand full timer

---

**Phase 5 Done ✓** — Functional Pomodoro timer that logs sessions and updates study time analytics.

---

---

# PHASE 6 — Notes System
**Duration:** Weeks 13–14 (10 days)  
**Goal:** Full rich-text note editor with TipTap, auto-save, tags, full-text search, version history, export.

---

### Step 6.1 — TipTap Editor Setup (Day 64-65)

Create `src/components/notes/NoteEditor.tsx`:

```tsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Underline from '@tiptap/extension-underline'
import { useEffect, useCallback } from 'react'
import { EditorToolbar } from './EditorToolbar'

interface NoteEditorProps {
  initialContent?: object
  onSave: (content: { json: object; markdown: string }) => void
}

export function NoteEditor({ initialContent, onSave }: NoteEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image,
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Underline,
    ],
    content: initialContent || '<p></p>',
  })

  // Auto-save every 3 seconds
  const save = useCallback(() => {
    if (!editor) return
    const json = editor.getJSON()
    const markdown = editor.storage.markdown?.getMarkdown?.() ?? ''
    onSave({ json, markdown })
  }, [editor, onSave])

  useEffect(() => {
    const timer = setInterval(save, 3000)
    return () => clearInterval(timer)
  }, [save])

  return (
    <div className="flex flex-col h-full border border-border rounded-xl overflow-hidden bg-card">
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-y-auto p-6">
        <EditorContent
          editor={editor}
          className="prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-full"
        />
      </div>
    </div>
  )
}
```

---

### Step 6.2 — Editor Toolbar (Day 65-66)

Create `src/components/notes/EditorToolbar.tsx` with buttons for:
H1, H2, H3, Bold, Italic, Underline, Strike, Highlight (4 colors), Bullet list, Ordered list, Checklist, Blockquote, Code block, Table, Link, Image.

Use shadcn `Toggle` and `ToggleGroup` components for the toolbar buttons.

---

### Step 6.3 — Note CRUD + Auto-save (Day 67-68)

Create `src/lib/queries/notes.ts`:

```ts
export function useNotes() { /* fetch all notes for user, sorted by updated_at */ }
export function useNote(id: string) { /* fetch single note with content */ }
export function useCreateNote() { /* create new note, return id */ }
export function useUpdateNote() { /* upsert content_json, content_md, plain_text_search */ }
export function useDeleteNote() { /* soft delete */ }
```

Auto-save: in `NoteEditor`, the `onSave` prop calls `updateNote` mutation. On save, also snapshot a version in `note_versions`.

---

### Step 6.4 — Notes List Page (Day 68-69)

Create `src/pages/NotesPage.tsx`:
- Two-panel layout: left = note list, right = editor
- List shows: title, tags, last updated, linked syllabus nodes count
- Click note → opens in editor panel
- "New Note" button at top creates blank note and opens it
- Search input → filters by full-text (calls Postgres `plainto_tsquery`)

---

### Step 6.5 — Full-text Search (Day 70)

```ts
// In queries/notes.ts
export function useNoteSearch(query: string) {
  return useQuery({
    queryKey: ['notes-search', query],
    enabled: query.length > 2,
    queryFn: async () => {
      const { data } = await supabase
        .from('notes')
        .select('id, title, updated_at')
        .textSearch('plain_text_search', query, { type: 'websearch' })
        .eq('is_deleted', false)
        .limit(20)
      return data
    }
  })
}
```

---

### Step 6.6 — Version History (Day 71-72)

In the note editor header, add a "History" button.  
Opens a side panel listing last 20 versions with timestamps.  
Click a version → shows a read-only preview.  
"Restore this version" → updates note content to that version's content.

---

### Step 6.7 — Export (Day 73)

Add "Export" dropdown to note editor toolbar:

**Export as Markdown:** `const blob = new Blob([markdownContent], { type: 'text/markdown' })`  
**Export as PDF:** Use `window.print()` with a print-specific CSS that hides the toolbar. Or use `jsPDF` library.

---

**Phase 6 Done ✓** — Full rich-text notes with auto-save, search, version history, and export.

---

---

# PHASE 7 — Key Notes & Spaced Repetition
**Duration:** Weeks 15–16 (8 days)  
**Goal:** Flashcard system with SM-2 algorithm, daily review queue.

---

### Step 7.1 — SM-2 Algorithm (Day 79)

Create `src/lib/utils/sm2.ts`:

```ts
export interface SM2State {
  ease_factor:   number   // min 1.3, default 2.5
  interval_days: number   // current interval
  repetitions:   number
}

// quality: 0=Forgot, 1=Hard, 2=Good, 3=Easy
export function calculateNextReview(state: SM2State, quality: 0 | 1 | 2 | 3): SM2State & { next_review_days: number } {
  let { ease_factor, interval_days, repetitions } = state

  if (quality === 0) {
    // Forgot → reset to beginning
    return { ease_factor, interval_days: 1, repetitions: 0, next_review_days: 1 }
  }

  const efDelta = 0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02)
  ease_factor = Math.max(1.3, ease_factor + efDelta)

  if (repetitions === 0)        interval_days = 1
  else if (repetitions === 1)   interval_days = 6
  else                          interval_days = Math.round(interval_days * ease_factor)

  return { ease_factor, interval_days, repetitions: repetitions + 1, next_review_days: interval_days }
}
```

---

### Step 7.2 — Key Notes CRUD (Day 80-81)

Create `src/components/key-notes/KeyNoteForm.tsx` — simple form: front text, back text, linked syllabus node.

Create `src/lib/queries/keyNotes.ts`:
- `useDueKeyNotes()` — fetches notes where `next_review_at <= now()`
- `useCreateKeyNote()` — create from a full note's content (AI generates front/back in Phase 13)
- `useReviewKeyNote()` — updates SM-2 fields after a review

---

### Step 7.3 — Review Session UI (Day 82-84)

Create `src/components/key-notes/ReviewSession.tsx`:

```tsx
// Flashcard UI:
// - Show front text
// - "Show Answer" button → flip to show back
// - 4 buttons: Forgot / Hard / Good / Easy
// - Progress: "3 of 12 cards reviewed today"
// - When all done: "Great job! Next review tomorrow."
```

---

### Step 7.4 — Revision Engine Integration (Day 85-88)

When a syllabus node is marked `completed`, the `useUpdateProgress` mutation should also:
1. Set `next_revision_at = now + 1 day`
2. Create revision task records at Day 1, 3, 7, 21, 45, 90:

```ts
const revisionDays = [1, 3, 7, 21, 45, 90]
const revisionTasks = revisionDays.map(d => ({
  user_id:          userId,
  title:            `Revise: ${nodeTitle}`,
  type:             'revision',
  syllabus_node_id: nodeId,
  target_date:      addDays(new Date(), d).toISOString().split('T')[0],
  priority:         'p2',
}))
await supabase.from('tasks').insert(revisionTasks)
```

---

**Phase 7 Done ✓** — Flashcard review with SM-2, auto-scheduled revision tasks on topic completion.

---

---

# PHASE 8 — Resource & File Management
**Duration:** Weeks 17–19 (15 days)  
**Goal:** File uploads, in-app PDF viewer with annotations, image lightbox, folder management.

---

### Step 8.1 — File Upload Component (Day 89-91)

Create `src/components/resources/FileUpload.tsx`:

```tsx
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'   // npm install react-dropzone
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'          // npm install uuid @types/uuid

export function FileUpload({ onUploadComplete }: { onUploadComplete: (id: string) => void }) {
  const { session } = useAuthStore()

  const onDrop = useCallback(async (files: File[]) => {
    for (const file of files) {
      // Validate MIME type
      const allowed = ['application/pdf','image/jpeg','image/png','image/webp',
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                       'audio/mpeg','audio/mp4']
      if (!allowed.includes(file.type)) {
        toast.error(`${file.name}: unsupported file type`)
        continue
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name}: exceeds 50 MB limit`)
        continue
      }

      const fileId   = uuidv4()
      const filePath = `${session!.user.id}/${fileId}/${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(filePath, file)

      if (uploadError) { toast.error(`Upload failed: ${uploadError.message}`); continue }

      const { data, error: dbError } = await supabase.from('attachments').insert({
        user_id:   session!.user.id,
        file_path: filePath,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      }).select('id').single()

      if (dbError) toast.error('Failed to save file record')
      else onUploadComplete(data.id)
    }
  }, [session])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: true })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
    >
      <input {...getInputProps()} />
      <p className="text-muted-foreground text-sm">
        {isDragActive ? 'Drop files here…' : 'Drag & drop files, or click to browse'}
      </p>
      <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, JPG, PNG, MP3 — max 50 MB each</p>
    </div>
  )
}
```

---

### Step 8.2 — PDF Viewer (Day 92-95)

Install: `npm install react-pdf`

Create `src/components/resources/PDFViewer.tsx`:
- Render PDF pages using `<Document>` + `<Page>` from react-pdf
- Navigation: prev/next page, page number input, zoom slider
- Highlight tool: on text selection, show color picker → save annotation to `pdf_annotations` table
- Show saved annotations as colored overlays on each page
- Comment tool: click anywhere on page → add text comment, stored in `pdf_annotations`

---

### Step 8.3 — Image Lightbox (Day 96)

Install: `npm install yet-another-react-lightbox`

Simple wrapper:
```tsx
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

// Usage:
<Lightbox open={open} close={() => setOpen(false)} slides={[{ src: imageUrl }]} />
```

---

### Step 8.4 — Resources Page (Day 97-100)

Create `src/pages/ResourcesPage.tsx`:
- Folder tree on left (user-defined folders, stored as `folder_path` on attachments)
- File grid on right with: thumbnail (PDF first page or image), name, size, date, type badge
- Click PDF → opens PDFViewer modal
- Click image → opens Lightbox
- Storage usage bar at top: `(totalSizeBytes / (1024^3)).toFixed(2) GB used`
- Bulk select + delete (soft delete: set `deleted_at`)
- Trash view with "30 days before permanent deletion" notice

---

**Phase 8 Done ✓** — Files uploadable, PDF viewable with annotations, all files manageable.

---

---

# PHASE 9 — Test & PYQ Tracker
**Duration:** Weeks 20–21 (10 days)  
**Goal:** Log mock tests, track mistakes, PYQ attempts, Mains answer practice.

---

### Step 9.1 — Mock Test Form (Day 104-105)

Form fields: name, date, source, type, total marks, scored marks, time taken, sectional breakdown (dynamic rows: subject name + total + scored).

Save to `tests` table.

---

### Step 9.2 — Performance Charts (Day 106-107)

Use Recharts:

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// Score over time
<ResponsiveContainer width="100%" height={240}>
  <LineChart data={tests.map(t => ({
    date: t.date,
    score: (t.scored_marks / t.total_marks * 100).toFixed(1)
  }))}>
    <XAxis dataKey="date" />
    <YAxis domain={[0, 100]} />
    <Tooltip />
    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
  </LineChart>
</ResponsiveContainer>
```

---

### Step 9.3 — Mistake Log (Day 108-110)

After logging a test, show "Add Mistakes" button.  
Each mistake entry: question text (or image upload), correct answer, your answer, linked syllabus node, reasoning.

On save:
- Insert into `test_mistakes`
- Auto-create a `revision` task linked to the syllabus node:

```ts
await supabase.from('tasks').insert({
  user_id:          userId,
  title:            `Revise mistake: ${nodeTitle}`,
  type:             'revision',
  syllabus_node_id: mistake.syllabus_node_id,
  target_date:      tomorrow,
  priority:         'p1',   // Mistakes are high priority
})
```

---

### Step 9.4 — PYQ Tracker (Day 111-112)

Table view: rows = years (1979–current), columns = papers.  
Each cell = number of questions attempted / correct / wrong.  
Click a cell → opens question list for that year+paper.  
Each question: status chip (Not Attempted / Correct / Wrong / Skipped), your answer, notes.

---

### Step 9.5 — Mains Answer Tracker (Day 113-114)

Form: question text, answer image upload (or type answer), syllabus node link, 4 ratings (Structure/Content/Diagram/Conclusion each 1-5), review notes.

List view shows: question excerpt, overall score (avg of 4 ratings), date, AI feedback chip.

---

**Phase 9 Done ✓** — Complete test tracking with mistake-to-revision-task pipeline.

---

---

# PHASE 10 — Current Affairs
**Duration:** Weeks 22–23 (8 days)

---

### Step 10.1 — CA Entry Form (Day 117-118)

Fields: date, source URL, title, summary (rich text with TipTap — reuse NoteEditor), tags (autocomplete from existing tags), syllabus node links (multi-select).

---

### Step 10.2 — CA List (Day 119-120)

- Paginated list, grouped by date
- Search by title/tags
- Filter by date range, linked subject
- Month selector to view a month's worth

---

### Step 10.3 — Monthly Compilation (Day 121-122)

Button "Export month to PDF":
1. Fetch all CA entries for selected month
2. Render them in a `<div>` with print-friendly CSS
3. Call `window.print()` or use html2pdf library

---

### Step 10.4 — Daily CA Reminder Check (Day 123)

In the dashboard, show a banner if today has no CA entry:
```tsx
{!hasTodayCA && (
  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center gap-3">
    <AlertTriangle className="h-4 w-4 text-amber-500" />
    <span className="text-sm text-amber-700 dark:text-amber-300">No current affairs logged today.</span>
    <Button size="sm" variant="outline" onClick={() => navigate('/current-affairs/new')}>Add Now</Button>
  </div>
)}
```

---

**Phase 10 Done ✓**

---

---

# PHASE 11 — Long-term Roadmap
**Duration:** Week 24 (5 days)

---

### Step 11.1 — Roadmap Timeline Component (Day 126-128)

Create `src/components/roadmap/RoadmapTimeline.tsx`:

- Horizontal timeline from today to exam date
- Colored phase blocks with labels (Foundation, Consolidation, etc.)
- Drag phase boundaries to resize phases
- Show current date marker
- Show per-subject "must finish by" deadlines

For drag-resize, use `useRef` + mouse events to detect drag on left/right edges of phase blocks.

---

### Step 11.2 — Completion Feasibility Check (Day 129-130)

Show a warning banner if the math doesn't work:

```ts
const remainingSyllabusHours = totalLeafNodes * avgHoursPerNode * (1 - completionPct / 100)
const daysLeft = differenceInDays(examDate, new Date())
const hoursNeeded = remainingSyllabusHours / daysLeft
const feasible = hoursNeeded <= profile.daily_target_hours

// If not feasible, show red warning: "You need X hrs/day but your target is Y hrs/day"
```

---

**Phase 11 Done ✓**

---

---

# PHASE 12 — Analytics Dashboard
**Duration:** Weeks 25–27 (15 days)

---

### Step 12.1 — Dashboard Page Layout (Day 134-135)

Create `src/pages/DashboardPage.tsx` with a CSS Grid layout:

```
┌─────────────────┬──────────┬───────────────┐
│   Today Widget  │  Streak  │  Countdown    │
├────────┬────────┴──────────┴───────────────┤
│Syllabus│         Study Heatmap             │
│ Rings  │                                   │
├────────┴───────────────────────────────────┤
│  Subject Distribution  │ Revision Health   │
├────────────────────────┴───────────────────┤
│          Productivity Score (30d)          │
└────────────────────────────────────────────┘
```

---

### Step 12.2 — Today Widget (Day 135)

Show:
- Tasks planned today vs completed (X / Y)
- Focused minutes vs target (X / Y min)
- Linear progress bar
- "Start Day" CTA if nothing started yet

---

### Step 12.3 — Streak Widget (Day 136)

- Current study streak (consecutive days with > 0 minutes studied)
- Longest streak
- Revision streak (consecutive days with at least 1 revision)

Compute from `daily_logs` table.

---

### Step 12.4 — Syllabus Completion Rings (Day 137)

Two donut charts (Recharts `RadialBarChart`):
- Prelims % complete
- Mains % complete

---

### Step 12.5 — GitHub-style Study Heatmap (Day 138-139)

Create `src/components/analytics/StudyHeatmap.tsx`:

52 weeks × 7 days grid. Each cell = a day. Color intensity based on `actual_minutes` for that day.

```tsx
// Color scale based on minutes
function getHeatColor(minutes: number): string {
  if (minutes === 0)   return 'bg-muted'
  if (minutes < 120)   return 'bg-primary/25'
  if (minutes < 240)   return 'bg-primary/50'
  if (minutes < 360)   return 'bg-primary/75'
  return 'bg-primary'
}
```

---

### Step 12.6 — Subject-wise Time Distribution (Day 140-141)

Pie chart showing time spent per subject in chosen window (7d/30d/90d/all-time).  
Flag any subject < 60% of its target share in red.

Fetch from `study_sessions` joined with `tasks` joined with `syllabus_nodes`.

---

### Step 12.7 — Revision Health Widget (Day 142)

```tsx
const { data: overdue } = useQuery({
  queryKey: ['overdue-revisions'],
  queryFn: async () => {
    const { data } = await supabase.from('v_overdue_revisions')
      .select('overdue_bucket')
      .eq('user_id', userId)
    // Group by bucket
    return groupBy(data, 'overdue_bucket')
  }
})
```

Show 3 rows: "1-3 days overdue: X topics", "4-7 days: Y", "7+ days: Z".

---

### Step 12.8 — Productivity Score (Day 143-144)

Create `src/lib/utils/productivity.ts`:

```ts
// Score = 40% plan adherence + 30% focus quality + 30% revision adherence
export function computeProductivityScore(
  plannedMinutes: number,
  actualMinutes: number,
  avgFocusScore: number,       // 1-5
  revisionsScheduled: number,
  revisionsCompleted: number
): number {
  const adherence = Math.min(1, actualMinutes / plannedMinutes)
  const focus     = (avgFocusScore - 1) / 4     // normalize to 0-1
  const revision  = revisionsScheduled > 0
    ? Math.min(1, revisionsCompleted / revisionsScheduled)
    : 1

  return Math.round((adherence * 0.4 + focus * 0.3 + revision * 0.3) * 100)
}
```

---

### Step 12.9 — Countdown + Headline Metric (Day 145)

```tsx
const daysLeft = differenceInDays(examDate, new Date())
const hrsPerDayNeeded = remainingHours / daysLeft

<div className="text-center p-6 bg-card border border-border rounded-xl">
  <p className="text-5xl font-bold text-foreground tabular-nums">{daysLeft}</p>
  <p className="text-muted-foreground text-sm mt-1">days to Prelims</p>
  <p className="text-sm mt-3 text-foreground">
    <span className="text-primary font-semibold">{completionPct}%</span> syllabus done ·{' '}
    <span className="font-semibold">{hrsPerDayNeeded.toFixed(1)} hrs/day</span> needed to finish on time
  </p>
</div>
```

---

### Step 12.10 — Weekly Review Report (Day 146-148)

Every Sunday, auto-generate text summary:
- Compute from `daily_logs` for past 7 days
- Show in a card on dashboard or as a notification

```ts
const weeklyReport = {
  totalHours:       (totalMinutes / 60).toFixed(1),
  completionPct:    Math.round(tasksCompleted / tasksTotal * 100),
  topSubject:       findTopSubject(sessions),
  laggingSubject:   findLaggingSubject(sessions, targets),
  suggestions:      generateSuggestions(completionPct, revisionHealth),
}
```

---

**Phase 12 Done ✓** — Full analytics dashboard with all required widgets.

---

---

# PHASE 13 — AI Assistant
**Duration:** Weeks 28–30 (15 days)  
**Goal:** All 6 AI features proxied through Supabase Edge Functions.

---

### Step 13.1 — Create Edge Functions (Day 149-151)

Senior developer creates Supabase Edge Functions at `supabase/functions/`.

Create `supabase/functions/ai-proxy/index.ts`:

```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const OPENROUTER_URL     = 'https://openrouter.ai/api/v1/chat/completions'

serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  // Verify user JWT
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return new Response('Unauthorized', { status: 401 })

  const { feature, model, messages, userId } = await req.json()

  // Call OpenRouter
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': Deno.env.get('APP_URL') ?? '',
    },
    body: JSON.stringify({ model, messages }),
  })

  const result = await response.json()

  // Log token usage
  await supabase.from('ai_usage').insert({
    user_id:           user.id,
    model,
    prompt_tokens:     result.usage?.prompt_tokens ?? 0,
    completion_tokens: result.usage?.completion_tokens ?? 0,
    feature,
  })

  return new Response(JSON.stringify({
    content: result.choices?.[0]?.message?.content ?? '',
    usage:   result.usage,
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

Deploy:
```bash
supabase functions deploy ai-proxy
```

---

### Step 13.2 — Frontend AI Client (Day 151)

Create `src/lib/ai.ts`:

```ts
import { supabase } from './supabase'

export async function callAI(params: {
  feature: string
  model: string
  messages: { role: 'user' | 'system' | 'assistant'; content: string }[]
}): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`,
    {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(params),
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`AI request failed: ${text}`)
  }

  const data = await response.json()
  return data.content
}
```

---

### Step 13.3 — AI Features (Day 152-163)

Create `src/components/ai/AIAssistant.tsx` — main AI page with tabs for each feature.

**Note Summarizer** (Day 152-153):
```ts
const summary = await callAI({
  feature: 'note_summarizer',
  model: selectedModel,
  messages: [{
    role: 'user',
    content: `Summarize the following UPSC study note. Give:
1. A concise summary (3-4 sentences)
2. Key points (bullet list, max 10)
3. 3 possible Mains questions this topic could generate
4. 3 Prelims-style MCQs with answers

Note content:
${noteContent}`
  }]
})
```

**Key Note Generator** (Day 154-155):
Converts a note into flashcard front/back pairs. AI returns JSON array of `{ front, back }`.

**Answer Evaluator** (Day 156-157):
User pastes Mains answer. AI rates Structure/Content/Diagram/Conclusion each /5 with feedback.

**Doubt Chat (RAG)** (Day 158-159):
1. User types a question
2. Fetch top-5 relevant notes using full-text search
3. Pass notes as context in system prompt
4. Show AI response in a chat UI

**Quiz Generator** (Day 160-161):
User selects a syllabus node. AI generates N MCQs with explanations.

**All AI outputs must:**
- Be labeled with "AI Generated — verify before use" badge
- Be editable before saving
- Show token count used

---

**Phase 13 Done ✓** — All AI features working via Edge Functions, API key never in browser.

---

---

# PHASE 14 — Notifications & Reminders
**Duration:** Week 31 (8 days)

---

### Step 14.1 — In-app Notification Center (Day 164-165)

Wire up the notification bell in Topbar:

```tsx
const { data: notifications } = useQuery({
  queryKey: ['notifications'],
  queryFn: async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    return data
  },
  refetchInterval: 30000,  // poll every 30 sec
})

const unreadCount = notifications?.filter(n => !n.is_read).length ?? 0
```

Dropdown shows notification list. Click → marks read + navigates to `link`.

---

### Step 14.2 — Browser Push Notifications (Day 166-167)

Request permission on first use:

```ts
const registration = await navigator.serviceWorker.register('/sw.js')
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
})

// Save subscription to Supabase
await supabase.from('push_subscriptions').upsert({
  user_id:  userId,
  endpoint: subscription.endpoint,
  p256dh:   btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
  auth:     btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
})
```

Create `public/sw.js`:
```js
self.addEventListener('push', (event) => {
  const data = event.data?.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      data: { link: data.link },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data.link))
})
```

---

### Step 14.3 — Email Reminders via Resend (Day 168-169)

Create `supabase/functions/send-reminder/index.ts` — Edge Function that:
1. Queries `reminders` table for `scheduled_at <= now() AND sent_at IS NULL`
2. Sends email via Resend API
3. Updates `sent_at = now()`

This function is called by a cron job (Supabase cron or pg_cron).

---

### Step 14.4 — Scheduled Edge Functions (Day 170-171)

Set up cron jobs in Supabase (Dashboard → Edge Functions → Schedules):

| Function           | Schedule        | Purpose                          |
|--------------------|-----------------|----------------------------------|
| `send-reminder`    | Every 15 min    | Process due reminders            |
| `slip-alert`       | Daily 9 AM      | Flag users with 0 study for 2 days |
| `weekly-report`    | Sunday 8 PM     | Generate weekly summary          |
| `hard-delete-files`| Daily 2 AM      | Delete attachments with `deleted_at < now - 30 days` |

---

**Phase 14 Done ✓**

---

---

# PHASE 15 — Settings & Profile
**Duration:** Week 32 (6 days)

---

### Step 15.1 — Settings Page (Day 174-175)

Create `src/pages/SettingsPage.tsx` with sections:

1. **Profile** — name, photo upload, exam date, optional subject, exam medium
2. **Theme** — Light/Dark/Auto toggle
3. **Notifications** — toggles for each notification type, push + email
4. **AI** — OpenRouter API key field (masked), default model select, monthly token cap
5. **Data** — Export account data, Delete account
6. **Security** — Change password, Change email

---

### Step 15.2 — Avatar Upload (Day 175)

```ts
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/${uuidv4()}.jpg`, file, { upsert: true })

const publicUrl = supabase.storage.from('avatars').getPublicUrl(data.path).data.publicUrl

await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', userId)
```

---

### Step 15.3 — Data Export (Day 176-177)

Button "Export all data":
1. Fetch all tables for the user (profiles, tasks, notes, etc.)
2. Package as JSON
3. Optionally include file download links
4. Create a `data-export-{date}.json` file and trigger browser download:

```ts
const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
const url  = URL.createObjectURL(blob)
const a    = document.createElement('a'); a.href = url; a.download = 'preptrack-export.json'; a.click()
```

---

### Step 15.4 — Account Deletion (Day 178)

Show confirmation dialog with text "Delete PrepTrack Account":
1. User types their email to confirm
2. Call Edge Function `delete-account` (senior dev creates this)
3. Edge Function uses service role to delete auth.user → cascades all user data
4. Sign out and redirect to auth page

---

**Phase 15 Done ✓**

---

---

# PHASE 16 — Testing, QA & Security
**Duration:** Weeks 33–35 (12 days)

---

### Step 16.1 — Unit Tests with Vitest (Day 182-185)

Create test files for all utility functions:

```
src/lib/utils/sm2.test.ts         ← SM-2 algorithm correctness
src/lib/utils/completion.test.ts  ← Completion % roll-up
src/lib/utils/productivity.test.ts← Productivity score
src/lib/utils/generateRoadmap.test.ts
```

Example:
```ts
import { describe, it, expect } from 'vitest'
import { calculateNextReview } from './sm2'

describe('SM-2', () => {
  it('resets to day 1 on Forgot (quality=0)', () => {
    const result = calculateNextReview({ ease_factor: 2.5, interval_days: 10, repetitions: 3 }, 0)
    expect(result.interval_days).toBe(1)
    expect(result.repetitions).toBe(0)
  })
  it('increases interval on Good review', () => {
    const result = calculateNextReview({ ease_factor: 2.5, interval_days: 6, repetitions: 2 }, 2)
    expect(result.interval_days).toBeGreaterThan(6)
  })
})
```

Run: `npm run test`

---

### Step 16.2 — E2E Tests with Playwright (Day 186-188)

Install: `npm install -D @playwright/test`

Write the critical flow test:
```ts
// tests/e2e/signup-to-dashboard.spec.ts
import { test, expect } from '@playwright/test'

test('full user journey', async ({ page }) => {
  await page.goto('/')

  // Sign up
  await page.click('text=Sign up')
  await page.fill('[name=email]', 'test+e2e@example.com')
  await page.fill('[name=password]', 'TestPass123!')
  await page.click('button[type=submit]')

  // Verify email (Supabase test mode)
  // Complete onboarding
  // Check dashboard loads
  await expect(page.locator('text=Dashboard')).toBeVisible()
})
```

---

### Step 16.3 — Security Checklist (Day 189-191)

Run these checks:

**RLS Verification:**
```sql
-- In Supabase SQL editor, run as a second test user:
-- Should return 0 rows (cannot see user1's data)
SELECT * FROM notes WHERE user_id = '<user1-id>';
```

**Bundle inspection:**
```bash
npm run build
grep -r "SUPABASE_SERVICE_ROLE" dist/   # Must return nothing
grep -r "OPENROUTER_API_KEY" dist/       # Must return nothing
grep -r "RESEND_API_KEY" dist/           # Must return nothing
```

**DOMPurify check:** Any note content displayed as HTML must be sanitized:
```ts
import DOMPurify from 'dompurify'
const safe = DOMPurify.sanitize(rawHtml)
```

---

### Step 16.4 — Accessibility Audit (Day 192-193)

Install axe DevTools Chrome extension and run on every page.  
Minimum: 0 critical, 0 serious issues.

Check manually:
- Tab through every form — focus order must be logical
- All modals trap focus
- All images have `alt` attributes
- All icon buttons have `aria-label`
- Color contrast ≥ 4.5:1 for all text

---

### Step 16.5 — Cross-browser Testing (Day 194-195)

Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest) — especially PDF viewer and drag-and-drop
- Edge (latest)
- Mobile Chrome (Android)
- Mobile Safari (iOS)

Check: layout, theme toggle, drag-and-drop, modals, PDF viewer.

---

**Phase 16 Done ✓**

---

---

# PHASE 17 — Performance Optimization
**Duration:** Week 36 (5 days)

---

### Step 17.1 — Lighthouse Audit (Day 196)

Run Lighthouse in Chrome DevTools on the Dashboard route.  
Target: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95.

Common fixes:
- Lazy-load heavy components (PDF viewer, charts):
  ```tsx
  const PDFViewer = React.lazy(() => import('../components/resources/PDFViewer'))
  ```
- Add `loading="lazy"` to all images
- Preload the Inter font in `index.html`

---

### Step 17.2 — Syllabus Tree Virtualization (Day 197)

If the full flat syllabus renders slowly, switch `SyllabusNodeRow` to use `react-window`:

```tsx
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={600}
  itemCount={flattenedNodes.length}
  itemSize={40}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <SyllabusNodeRow node={flattenedNodes[index]} />
    </div>
  )}
</FixedSizeList>
```

---

### Step 17.3 — React Query Caching Review (Day 198)

Ensure:
- `staleTime: 5 * 60 * 1000` on rarely-changing queries (syllabus tree, profile)
- Optimistic updates on task status toggle (no loading state, instant UI)
- Prefetch dashboard data on app start

---

### Step 17.4 — Code Splitting (Day 199)

Each route page should be lazy-loaded. In `App.tsx`:

```tsx
const DashboardPage   = React.lazy(() => import('./pages/DashboardPage'))
const SyllabusPage    = React.lazy(() => import('./pages/SyllabusPage'))
const NotesPage       = React.lazy(() => import('./pages/NotesPage'))
// ... etc

// Wrap routes in Suspense:
<Suspense fallback={<div className="h-screen flex items-center justify-center">...</div>}>
  <Routes>...</Routes>
</Suspense>
```

---

**Phase 17 Done ✓**

---

---

# PHASE 18 — Production Deployment
**Duration:** Days 203–210

---

### Step 18.1 — Supabase Production Checklist

In Supabase Dashboard:
- [ ] Enable email auth + Google OAuth
- [ ] Confirm "user-files" and "avatars" storage buckets exist
- [ ] Confirm daily DB backups are enabled (Project Settings → Database → Backups)
- [ ] Set up custom SMTP with Resend for transactional email
- [ ] Add all environment variables to Edge Functions secrets

---

### Step 18.2 — Vercel Production Deploy

1. Push to main branch on GitHub → Vercel auto-deploys
2. In Vercel project settings, add all env vars:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SENTRY_DSN`
   - `VITE_VAPID_PUBLIC_KEY`
   - `APP_URL`
3. Set custom domain in Vercel (e.g., `preptrack.app`)
4. Verify HTTPS is active

---

### Step 18.3 — Sentry Setup (Day 206)

In `src/main.tsx`:

```tsx
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.2,
})
```

Verify errors appear in Sentry dashboard after triggering one.

---

### Step 18.4 — Final Launch Checklist (Day 207-210)

- [ ] All MUST requirements from SRS section 6 implemented
- [ ] Both light and dark themes pass WCAG AA (test with axe)
- [ ] All charts render with empty/partial/full data
- [ ] RLS verified — second user cannot read first user's data
- [ ] No sensitive keys in browser bundle (`grep -r "service_role" dist/`)
- [ ] Sentry capturing errors
- [ ] DB backups confirmed enabled
- [ ] End-to-end flow: signup → onboarding → plan task → Pomodoro → upload PDF → AI notes → log test → see dashboard ✓
- [ ] Lighthouse: Performance ≥ 85, Accessibility ≥ 95
- [ ] Privacy Policy and Terms pages added (even basic text drafts) and linked in footer
- [ ] Custom domain confirmed with SSL

---

**Phase 18 Done ✓ — PrepTrack v1.0 is LIVE.**

---

---

# APPENDIX A — Environment Variables Reference

| Variable                  | Used In         | Safe in browser? |
|---------------------------|-----------------|-----------------|
| VITE_SUPABASE_URL          | Frontend         | Yes             |
| VITE_SUPABASE_ANON_KEY     | Frontend         | Yes             |
| VITE_SENTRY_DSN            | Frontend         | Yes             |
| VITE_VAPID_PUBLIC_KEY      | Frontend         | Yes             |
| SUPABASE_SERVICE_ROLE_KEY  | Edge Functions   | **NO**          |
| OPENROUTER_API_KEY         | Edge Functions   | **NO**          |
| RESEND_API_KEY             | Edge Functions   | **NO**          |
| VAPID_PRIVATE_KEY          | Edge Functions   | **NO**          |

---

# APPENDIX B — Key npm Commands

```bash
npm run dev          # Start dev server at localhost:5173
npm run build        # Production build to dist/
npm run preview      # Preview production build locally
npm run test         # Run Vitest unit tests
npx playwright test  # Run E2E tests

# Supabase CLI
npx supabase start                        # Local Supabase
npx supabase functions serve ai-proxy     # Test Edge Function locally
npx supabase functions deploy ai-proxy    # Deploy to cloud
npx supabase gen types typescript ...     # Regenerate DB types
```

---

# APPENDIX C — React Query Pattern (use everywhere)

```ts
// FETCH (useQuery)
export function useTasks(date: string) {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['tasks', date, session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session!.user.id)
        .eq('target_date', date)
        .order('sort_order')
      if (error) throw error
      return data
    },
  })
}

// MUTATE (useMutation)
export function useCreateTask() {
  const qc = useQueryClient()
  const { session } = useAuthStore()
  return useMutation({
    mutationFn: async (task: NewTask) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...task, user_id: session!.user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks', variables.target_date] })
      toast.success('Task created')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
```

---

# APPENDIX D — Common Gotchas

| Problem | Fix |
|---------|-----|
| `auth.uid()` returns null in SQL | User is not logged in; check Supabase JWT |
| Supabase RLS blocks all rows | Make sure RLS policy uses `USING` not just `WITH CHECK` |
| Dark mode not applying | Call `applyTheme()` on app start from persisted theme store |
| React Query stale data | Call `queryClient.invalidateQueries()` after every mutation |
| TipTap content not saving | Ensure `onSave` is wrapped in `useCallback` to avoid re-renders |
| PDF viewer blank on Safari | Use `pdfjs-dist` directly; react-pdf has Safari quirks |
| Drag and drop not working on mobile | Add touch-action: none to draggable elements |
| Supabase storage signed URL expires | Always fetch fresh signed URL; don't cache them > 1 hr |
| Edge Function cold start slow | Add warmup pings or use Supabase cron to keep it warm |
| VAPID push not showing on iOS | iOS requires iOS 16.4+ and PWA installed to home screen |

---

*End of PrepTrack Implementation Plan v1.0*
