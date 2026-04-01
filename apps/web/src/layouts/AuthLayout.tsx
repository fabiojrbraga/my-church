import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { Church } from 'lucide-react'

export function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'hsl(var(--sidebar))' }}>
      {/* Painel esquerdo — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-12"
        style={{ borderRight: '1px solid hsl(var(--sidebar-border))' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Church className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-white text-xl tracking-tight">MyChurch</span>
        </div>

        <div>
          <blockquote className="text-lg font-light leading-relaxed" style={{ color: 'hsl(var(--sidebar-foreground))' }}>
            "Gerencie sua igreja com clareza, cuidado e eficiência — de membros à tesouraria, tudo em um só lugar."
          </blockquote>
          <p className="mt-4 text-sm font-medium" style={{ color: 'hsl(var(--sidebar-foreground))' }}>
            Sistema de Gestão de Igrejas
          </p>
        </div>

        <div className="flex gap-3">
          {['Membros', 'Finanças', 'Escalas', 'Eventos'].map((tag) => (
            <span key={tag} className="text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{ backgroundColor: 'hsl(var(--sidebar-item-active))', color: 'hsl(var(--sidebar-foreground))' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-[400px] animate-fade-in">
          {/* Logo mobile */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Church className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-foreground text-lg tracking-tight">MyChurch</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
