import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoadingScreen } from './components/LoadingScreen'
import { ProtectedRoute } from './components/ProtectedRoute'
import { getDashboardPath } from './types/models'

const LoginPage = lazy(async () => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const StudentDashboard = lazy(async () =>
  import('./pages/StudentDashboard').then((module) => ({ default: module.StudentDashboard })),
)
const TeacherDashboard = lazy(async () =>
  import('./pages/TeacherDashboard').then((module) => ({ default: module.TeacherDashboard })),
)
const AdminDashboard = lazy(async () =>
  import('./pages/AdminDashboard').then((module) => ({ default: module.AdminDashboard })),
)
const NotFoundPage = lazy(async () =>
  import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
)

function HomeRedirect() {
  const { profile, loading } = useAuth()

  if (loading) {
    return <LoadingScreen label="Loading your portal workspace..." />
  }

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={getDashboardPath(profile.role)} replace />
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen label="Preparing your workspace..." />}>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student-dashboard" element={<StudentDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
