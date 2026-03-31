import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, Calendar, Music2,
  ClipboardList, Wallet, Settings, LogOut, Church,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/membros', label: 'Membros', icon: Users },
  { to: '/filiais', label: 'Filiais', icon: Building2 },
  { to: '/eventos', label: 'Eventos', icon: Calendar },
  { to: '/ministerios', label: 'Ministérios', icon: Church },
  { to: '/escalas', label: 'Escalas', icon: ClipboardList },
  { to: '/tesouraria', label: 'Tesouraria', icon: Wallet },
  { to: '/escalas-musica', label: 'Louvor', icon: Music2 },
]

export function Sidebar() {
  const logout = useAuthStore((s) => s.logout)

  return (
    <aside className="w-64 bg-card border-r flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-primary">MyChurch</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t space-y-1">
        <NavLink
          to="/configuracoes"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent"
        >
          <Settings className="w-4 h-4" />
          Configurações
        </NavLink>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
