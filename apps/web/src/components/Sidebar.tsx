import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Church, LogOut, X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { navigationSections, utilityNavigationItems } from '@/config/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { labels } from '@my-church/shared'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }

    document.body.style.overflow = ''
  }, [open])

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-200 lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[18rem] flex-col border-r border-sidebar-border/80 bg-sidebar/95 text-sidebar-foreground backdrop-blur-xl transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border/80 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white shadow-lg shadow-black/10">
              <Church className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-white">MyChurch</p>
              <p className="text-xs text-sidebar-foreground">ERP para gestão e operação</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Fechar navegação"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-4 pt-4">
          <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-sm font-bold text-white">
                {(user?.name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user?.name ?? user?.email}</p>
                <p className="truncate text-xs text-sidebar-foreground">
                  {user?.role ? labels.papelUsuario[user.role as keyof typeof labels.papelUsuario] : 'Equipe'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="border-white/10 bg-white/5 text-sidebar-foreground">
                Sessão ativa
              </Badge>
              <Badge variant="outline" className="border-white/10 bg-white/5 text-sidebar-foreground">
                Navegação responsiva
              </Badge>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {navigationSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/70">
                {section.title}
              </p>

              <div className="space-y-1.5">
                {section.items.map(({ to, label, icon: Icon, description, status }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'group flex rounded-[1.25rem] border px-3.5 py-3 transition-all duration-200',
                        isActive
                          ? 'border-white/10 bg-sidebar-item-active text-white shadow-lg shadow-black/10'
                          : 'border-transparent text-sidebar-foreground hover:border-white/5 hover:bg-sidebar-item-hover hover:text-white',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          className={cn(
                            'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-colors',
                            isActive
                              ? 'border-white/10 bg-white/10 text-white'
                              : 'border-white/5 bg-white/5 text-sidebar-foreground group-hover:text-white',
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="ml-3 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold">{label}</span>
                            {status === 'planned' && (
                              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground">
                                Preview
                              </span>
                            )}
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-sidebar-foreground/80">
                            {description}
                          </p>
                        </div>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border/80 px-3 py-4">
          <div className="space-y-1.5">
            {utilityNavigationItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-[1.1rem] px-3.5 py-3 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-item-active text-white'
                      : 'text-sidebar-foreground hover:bg-sidebar-item-hover hover:text-white',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            ))}

            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-[1.1rem] px-3.5 py-3 text-left text-sm font-medium text-sidebar-foreground transition-all duration-200 hover:bg-red-500/10 hover:text-red-200"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sair
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
