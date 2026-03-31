import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

interface Props {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)()
  if (!isAuthenticated) return <Navigate to="/entrar" replace />
  return <>{children}</>
}
