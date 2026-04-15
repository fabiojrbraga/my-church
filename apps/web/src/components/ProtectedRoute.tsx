import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

interface Props {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)

  if (!accessToken || !user) return <Navigate to="/entrar" replace />

  return <>{children}</>
}
