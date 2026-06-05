import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PublicHomePage } from '@/pages/home/PublicHomePage'
import { PublicPixPage } from '@/pages/pix/PublicPixPage'

export const router = createBrowserRouter([
  { path: '/', element: <PublicHomePage /> },
  { path: '/pix', element: <PublicPixPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
])
