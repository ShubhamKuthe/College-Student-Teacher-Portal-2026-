import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getDashboardPath, type Role } from '../types/models'
import { LoadingScreen } from './LoadingScreen'

interface ProtectedRouteProps {
  allowedRoles: Role[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <LoadingScreen label="Verifying your access..." />
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to={getDashboardPath(profile.role)} replace />
  }

  return <Outlet />
}
