import { Bell, Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { findNavigationItem } from '@/config/navigation'
import { labels } from '@my-church/shared'

interface HeaderProps {
  onOpenSidebar: () => void
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const currentItem = findNavigationItem(location.pathname)
  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : (user?.email?.[0] ?? 'U').toUpperCase()
  const todayLabel = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date())

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/82 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          onClick={onOpenSidebar}
          aria-label="Abrir navegação"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant={currentItem?.status === 'active' ? 'info' : 'warning'}>
              {currentItem?.status === 'active' ? 'Disponível' : 'Em implantação'}
            </Badge>
            <span className="hidden text-xs font-medium capitalize text-muted-foreground sm:inline-flex">
              {todayLabel}
            </span>
          </div>

          <h1 className="truncate font-display text-xl font-semibold text-foreground sm:text-2xl">
            {currentItem?.label ?? 'MyChurch'}
          </h1>
          <p className="mt-1 hidden max-w-2xl text-sm text-muted-foreground sm:block">
            {currentItem?.description ?? 'Painel central da operação da igreja.'}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="icon"
            className="border-border/60 bg-surface/70"
            aria-label="Notificações"
          >
            <Bell className="h-4 w-4" />
          </Button>

          <div className="hidden rounded-2xl border border-border/60 bg-surface/75 px-3 py-2 text-right shadow-sm shadow-slate-950/5 sm:block">
            <p className="text-sm font-semibold text-foreground">{user?.name ?? user?.email}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {user?.role ? labels.papelUsuario[user.role as keyof typeof labels.papelUsuario] : 'Equipe'}
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-sm font-bold text-primary shadow-sm shadow-primary/10">
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}
