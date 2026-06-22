import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, Plus, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import { SearchBox } from './SearchBox'

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user, signOut, configured } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ?? user?.email ?? 'Gast'

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-black/[0.06] bg-canvas/80 px-4 backdrop-blur lg:px-6">
      <button
        className="rounded-lg p-2 text-ink-soft hover:bg-black/[0.04] lg:hidden"
        onClick={onOpenMenu}
        aria-label="Menue oeffnen"
      >
        <Menu className="h-5 w-5" />
      </button>

      <SearchBox />

      <div className="ml-auto flex items-center gap-2">
        <Link to="/projekt/neu" className="btn-primary">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Neues Projekt</span>
        </Link>

        <div className="relative">
          <button
            className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 hover:bg-black/[0.04]"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Avatar name={displayName} size="sm" />
            <span className="hidden text-sm font-medium text-ink sm:inline">{displayName}</span>
            <ChevronDown className="h-4 w-4 text-ink-muted" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-52 animate-fade-in rounded-xl border border-black/[0.06] bg-surface p-1.5 shadow-card">
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-medium text-ink">{displayName}</p>
                  <p className="truncate text-xs text-ink-muted">{user?.email ?? 'Demo-Modus'}</p>
                </div>
                <div className="my-1 border-t border-black/[0.06]" />
                {configured ? (
                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                    Abmelden
                  </button>
                ) : (
                  <p className="px-3 py-2 text-xs text-ink-muted">Demo-Modus (kein Login)</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
