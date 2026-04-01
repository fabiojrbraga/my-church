import { Bell } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { labels } from '@my-church/shared'

export function Header() {
  const user = useAuthStore((s) => s.user)
  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : (user?.email?.[0] ?? 'U').toUpperCase()

  return (
    <header className="h-16 shrink-0 bg-card border-b flex items-center justify-between px-6">
      <div />

      <div className="flex items-center gap-2">
        {/* Notificações */}
        <button className="relative h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Bell className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-border mx-1" />

        {/* User */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
            {initials}
          </div>
          <div className="hidden sm:block leading-none">
            <p className="text-[13px] font-semibold text-foreground">{user?.name ?? user?.email}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {user?.role ? labels.papelUsuario[user.role as keyof typeof labels.papelUsuario] : ''}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
