import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, Timer, BookOpen, FileText,
  Layers, FolderOpen, ClipboardList, Newspaper, BarChart2,
  Sparkles, Settings, GraduationCap
} from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/',               icon: LayoutDashboard, label: 'Dashboard'      },
  { to: '/plan',           icon: CalendarDays,    label: 'Planner'        },
  { to: '/pomodoro',       icon: Timer,           label: 'Pomodoro'       },
  { to: '/syllabus',       icon: BookOpen,        label: 'Syllabus'       },
  { to: '/notes',          icon: FileText,        label: 'Notes'          },
  { to: '/key-notes',      icon: Layers,          label: 'Flashcards'     },
  { to: '/resources',      icon: FolderOpen,      label: 'Resources'      },
  { to: '/tests',          icon: ClipboardList,   label: 'Tests & PYQs'   },
  { to: '/current-affairs',icon: Newspaper,       label: 'Current Affairs'},
  { to: '/analytics',      icon: BarChart2,       label: 'Analytics'      },
  { to: '/ai',             icon: Sparkles,        label: 'AI Assistant'   },
  { to: '/settings',       icon: Settings,        label: 'Settings'       },
]

export function Sidebar() {
  return (
    <aside className="w-60 flex-shrink-0 border-r border-border bg-card flex flex-col">
      <div className="h-14 flex items-center px-5 border-b border-border gap-2">
        <GraduationCap className="h-5 w-5 text-primary" />
        <span className="font-semibold tracking-tight text-foreground">PrepTrack</span>
      </div>

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