import type { FC, ReactNode } from 'react'
import { Navigate } from '@tanstack/react-router'
import { useAuth } from '@/app/providers'

interface ProtectedRouteProps {
  children?: ReactNode
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8">
        <div className="w-12 h-12 border-4 border-accent-romantic/30 border-t-accent-romantic rounded-full animate-spin mb-4" />
        <p className="text-text-secondary text-sm font-medium animate-pulse">
          Cargando tu espacio privado...
        </p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
