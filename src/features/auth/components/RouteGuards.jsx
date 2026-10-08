import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { homePathForRole } from '../lib/roles'

const AuthPendingState = ({ message }) => (
  <section className="page-card auth-page-card">
    <h1 className="auth-status-title">Checking session</h1>
    <p>{message}</p>
  </section>
)

// Blocks unauthenticated access to protected routes.
// The intermediate `hasSession && isHydratingUser` state handles the window between
// token acquisition (verify/refresh) and the /auth/me response completing — without it
// the user would briefly see a login redirect on every page load with a valid session
export const RequireAuth = ({ children }) => {
  const location = useLocation()
  const { isAuthenticated, hasSession, isHydratingUser } = useAuth()

  if (isAuthenticated) {
    return children
  }

  if (hasSession && isHydratingUser) {
    return <AuthPendingState message="Finishing sign-in, please wait." />
  }

  // Preserve the intended destination so login can redirect back after success
  return (
    <Navigate
      to="/auth/login"
      replace
      state={{ from: `${location.pathname}${location.search}` }}
    />
  )
}

// Role-based route guard. Must be nested inside RequireAuth so `user` is loaded.
// A user navigating to a page outside their role is sent to their own home page —
// this is a UX redirect only; the API enforces authorization server-side as well.
export const RequireRole = ({ roles, children }) => {
  const { user } = useAuth()
  const role = user?.role ?? user?.Role

  if (roles.includes(role)) {
    return children
  }

  return <Navigate to={homePathForRole(role)} replace />
}

// Index route target: sends each role to its landing page
export const RoleHomeRedirect = () => {
  const { user } = useAuth()
  const role = user?.role ?? user?.Role
  return <Navigate to={homePathForRole(role)} replace />
}

// Blocks authenticated users from visiting auth pages (login, verify).
// Same hydration guard as RequireAuth to avoid a flash redirect while /auth/me is in-flight
export const RequireGuest = ({ children }) => {
  const { isAuthenticated, hasSession, isHydratingUser } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  if (hasSession && isHydratingUser) {
    return <AuthPendingState message="Finalizing your session." />
  }

  return children
}

// Root-level fallback: sends authenticated users to dashboard, everyone else to login
export const AuthFallbackRedirect = () => {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Navigate to="/auth/login" replace />
}
