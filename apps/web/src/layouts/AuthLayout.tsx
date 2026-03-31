import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

export function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">MyChurch</h1>
          <p className="text-muted-foreground mt-1">Sistema de Gestão de Igrejas</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
