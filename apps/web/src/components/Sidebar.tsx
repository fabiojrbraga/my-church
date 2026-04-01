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
    <aside className="w-[220px] shrink-0 flex flex-col h-full" style={{ backgroundColor: 'hsl(var(--sidebar))' }}>
      {/* Logo */}
      <div className="h-16 flex items-center px-5 shrink-0" style={{ borderBottom: '1px solid hsl(var(--sidebar-border))' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Church className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-white text-[17px] tracking-tight leading-none">
            MyChurch
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        <p className="px-2 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'hsl(var(--sidebar-foreground))' }}>
          Menu
        </p>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                isActive
                  ? 'text-white'
                  : 'hover:text-white',
              )
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'hsl(var(--sidebar-item-active))' : undefined,
              color: isActive ? 'white' : 'hsl(var(--sidebar-foreground))',
            })}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              if (!el.classList.contains('active')) {
                el.style.backgroundColor = 'hsl(var(--sidebar-item-hover))'
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              if (!el.classList.contains('active')) {
                el.style.backgroundColor = ''
              }
            }}
          >
            <Icon className="w-[15px] h-[15px] shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-0.5 shrink-0" style={{ borderTop: '1px solid hsl(var(--sidebar-border))', paddingTop: '12px' }}>
        <NavLink
          to="/configuracoes"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
          style={{ color: 'hsl(var(--sidebar-foreground))' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--sidebar-item-hover))'; e.currentTarget.style.color = 'white' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'hsl(var(--sidebar-foreground))' }}
        >
          <Settings className="w-[15px] h-[15px] shrink-0" />
          Configurações
        </NavLink>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
          style={{ color: 'hsl(var(--sidebar-foreground))' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = 'rgb(248,113,113)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'hsl(var(--sidebar-foreground))' }}
        >
          <LogOut className="w-[15px] h-[15px] shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  )
}
