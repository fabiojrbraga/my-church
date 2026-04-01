import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AppLayout } from '@/layouts/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/pages/auth/LoginPage'
import { BranchesPage } from '@/pages/branches/BranchesPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { MembersPage } from '@/pages/members/MembersPage'
import { ModulePlaceholderPage } from '@/pages/modules/ModulePlaceholderPage'

const moduleRoutes = [
  'eventos',
  'ministerios',
  'escalas',
  'tesouraria',
  'escalas-musica',
  'configuracoes',
] as const

export const router = createBrowserRouter([
  {
    path: '/entrar',
    element: <AuthLayout />,
    children: [{ index: true, element: <LoginPage /> }],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'membros', element: <MembersPage /> },
      { path: 'filiais', element: <BranchesPage /> },
      ...moduleRoutes.map((path) => ({ path, element: <ModulePlaceholderPage /> })),
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
