import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Calendar,
  Users,
  FolderOpen,
  CalendarRange,
  FileText,
  Settings,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const mainNav: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projekte', label: 'Projekte', icon: FolderKanban },
  { to: '/aufgaben', label: 'Aufgaben', icon: CheckSquare },
  { to: '/kalender', label: 'Kalender', icon: Calendar },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/dateien', label: 'Dateien', icon: FolderOpen },
  { to: '/zeitplan', label: 'Zeitplan', icon: CalendarRange },
  { to: '/vorlagen', label: 'Vorlagen', icon: FileText },
]

export const bottomNav: NavItem[] = [
  { to: '/einstellungen', label: 'Einstellungen', icon: Settings },
  { to: '/hilfe', label: 'Hilfe', icon: HelpCircle },
]
