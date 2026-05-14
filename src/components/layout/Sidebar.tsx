import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, Timer, BookOpen, FileText,
  Layers, FolderOpen, ClipboardList, Newspaper, BarChart2,
  Sparkles, Settings, GraduationCap, X, Target, HelpCircle,
  CalendarCheck2, BookMarked, Library, Trophy, TableProperties,
  RotateCcw, ListChecks
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface SidebarProps {
  onClose?: () => void
}

const sections = [
  {
    label: 'Overview',
    items: [
      { to: '/',          icon: LayoutDashboard, label: 'Dashboard'   },
      { to: '/analytics',    icon: BarChart2,         label: 'Analytics'    },
      { to: '/goals',        icon: Target,            label: 'Goals'        },
      { to: '/achievements', icon: Trophy,            label: 'Achievements' },
      { to: '/habits',       icon: ListChecks,        label: 'Habits'       },
    ],
  },
  {
    label: 'Plan',
    items: [
      { to: '/plan',          icon: CalendarDays,      label: 'Planner'        },
      { to: '/timetable',     icon: TableProperties,   label: 'Timetable'      },
      { to: '/exam-calendar', icon: CalendarCheck2,    label: 'Exam Calendar'  },
      { to: '/current-affairs', icon: Newspaper,     label: 'Current Affairs'},
    ],
  },
  {
    label: 'Study',
    items: [
      { to: '/syllabus',   icon: BookOpen,   label: 'Syllabus'    },
      { to: '/revision',   icon: RotateCcw,  label: 'Revision'    },
      { to: '/pomodoro',   icon: Timer,      label: 'Pomodoro'    },
      { to: '/notes',      icon: FileText,   label: 'Notes'       },
      { to: '/key-notes',  icon: Layers,     label: 'Flashcards'  },
      { to: '/quick-ref',  icon: BookMarked, label: 'Quick Ref'   },
      { to: '/reading-list', icon: Library,  label: 'Reading List'},
    ],
  },
  {
    label: 'Practice',
    items: [
      { to: '/tests',         icon: ClipboardList, label: 'Tests & PYQs'  },
      { to: '/mains-answers', icon: FileText,       label: 'Answer Writing'},
    ],
  },
  {
    label: 'Support',
    items: [
      { to: '/doubts',   icon: HelpCircle, label: 'Doubt Journal' },
      { to: '/resources',icon: FolderOpen, label: 'Resources'     },
      { to: '/ai',       icon: Sparkles,   label: 'AI Assistant'  },
    ],
  },
]

export function Sidebar({ onClose }: SidebarProps) {
  return (
    <aside className="w-56 flex-shrink-0 border-r border-border bg-card flex flex-col h-full">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border gap-2">
        <GraduationCap className="h-5 w-5 text-primary flex-shrink-0" />
        <span className="font-semibold tracking-tight text-foreground">PrepTrack</span>
        {onClose && (
          <button onClick={onClose} className="ml-auto md:hidden text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {sections.map((section, si) => (
          <div key={section.label} className={cn('mb-1', si > 0 && 'mt-4')}>
            <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {section.label}
            </p>
            {section.items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors mb-0.5',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Settings pinned to bottom */}
      <div className="p-2 border-t border-border">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors',
              isActive
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )
          }
        >
          <Settings className="h-3.5 w-3.5" />
          Settings
        </NavLink>
      </div>
    </aside>
  )
}
