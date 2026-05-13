import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, BookOpen, FileText, BarChart2 } from 'lucide-react'
import { cn } from '../../lib/utils'

const mobileItems = [
  { to: '/',         icon: LayoutDashboard, label: 'Home'     },
  { to: '/plan',     icon: CalendarDays,    label: 'Plan'     },
  { to: '/syllabus', icon: BookOpen,        label: 'Syllabus' },
  { to: '/notes',    icon: FileText,        label: 'Notes'    },
  { to: '/analytics',icon: BarChart2,       label: 'Stats'    },
]

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {mobileItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}