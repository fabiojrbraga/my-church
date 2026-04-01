import { useAuthStore } from '@/stores/auth.store'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Calendar, Church, Wallet, TrendingUp, ArrowRight } from 'lucide-react'

const stats = [
  {
    label: 'Membros',
    value: '—',
    description: 'Total cadastrados',
    icon: Users,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    label: 'Eventos',
    value: '—',
    description: 'Este mês',
    icon: Calendar,
    color: 'bg-violet-50 text-violet-600',
  },
  {
    label: 'Ministérios',
    value: '—',
    description: 'Ativos',
    icon: Church,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    label: 'Tesouraria',
    value: '—',
    description: 'Saldo atual',
    icon: Wallet,
    color: 'bg-emerald-50 text-emerald-600',
  },
]

const quickLinks = [
  { label: 'Cadastrar membro', to: '/membros/novo', icon: Users },
  { label: 'Criar evento', to: '/eventos/novo', icon: Calendar },
  { label: 'Ver escalas', to: '/escalas', icon: Church },
  { label: 'Lançar transação', to: '/tesouraria/novo', icon: TrendingUp },
]

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground tracking-tight">
          Olá, {user?.name?.split(' ')[0] ?? 'Administrador'} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bem-vindo(a) ao painel de gestão da sua igreja.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, description, icon: Icon, color }) => (
          <Card key={label} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {label}
                  </p>
                  <p className="font-display font-bold text-3xl text-foreground mt-1.5 leading-none">
                    {value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">{description}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-display font-semibold text-base text-foreground mb-3">
          Ações rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className="flex items-center justify-between gap-3 bg-card border rounded-xl px-4 py-3.5 text-left hover:border-primary/40 hover:bg-primary/3 transition-all duration-150 group card-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
