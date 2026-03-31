import { Bell } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { labels } from '@my-church/shared'

export function Header() {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-md hover:bg-accent">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-none">{user?.name ?? user?.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {user?.role ? labels.papelUsuario[user.role as keyof typeof labels.papelUsuario] : ''}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
