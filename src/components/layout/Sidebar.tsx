import { NavLink } from 'react-router-dom'
import { Compass, X } from 'lucide-react'
import { mainNav, bottomNav, type NavItem } from './nav'
import { cn } from '@/lib/utils'

function NavRow({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-brand-gradient text-white shadow-soft'
            : 'text-ink-soft hover:bg-black/[0.04] hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn('h-5 w-5 shrink-0', isActive ? 'text-white' : 'text-ink-muted group-hover:text-ink')}
          />
          {item.label}
        </>
      )}
    </NavLink>
  )
}

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile-Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-black/[0.06] bg-surface px-4 py-5 transition-transform duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-6 flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-soft">
              <Compass className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight text-ink">ProGuide</span>
          </div>
          <button
            className="rounded-lg p-1.5 text-ink-muted hover:bg-black/[0.04] lg:hidden"
            onClick={onClose}
            aria-label="Menue schliessen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {mainNav.map((item) => (
            <NavRow key={item.to} item={item} onNavigate={onClose} />
          ))}
        </nav>

        <div className="mt-4 space-y-1 border-t border-black/[0.06] pt-4">
          {bottomNav.map((item) => (
            <NavRow key={item.to} item={item} onNavigate={onClose} />
          ))}
        </div>
      </aside>
    </>
  )
}
