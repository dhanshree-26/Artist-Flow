import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const Loader = () => (
  <div className="loader-shell" role="status" aria-live="polite">
    <div className="loader-orb" />
    <p>Loading Artist Flow...</p>
  </div>
)

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading, isEmailVerified } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loader />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isEmailVerified) {
    return <Navigate to="/verify-email" replace />
  }

  return <>{children}</>
}

export const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading, isEmailVerified } = useAuth()

  if (loading) {
    return <Loader />
  }

  if (user && isEmailVerified) {
    return <Navigate to="/app" replace />
  }

  if (user && !isEmailVerified) {
    return <Navigate to="/verify-email" replace />
  }

  return <>{children}</>
}
