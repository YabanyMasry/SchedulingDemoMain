import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLogoutMutation } from '../api/hooks'
import { useAuth } from '../context/useAuth'

const LogoutPage = () => {
  const navigate = useNavigate()
  const { tokens, clearSession } = useAuth()
  const { mutateAsync: logout } = useLogoutMutation()

  useEffect(() => {
    let isCancelled = false

    const runLogout = async () => {
      try {
        if (tokens?.refreshToken) {
          await logout(tokens.refreshToken)
        }
      } catch {
        // Local session is always cleared even if server-side revoke fails.
      } finally {
        clearSession()
        if (!isCancelled) {
          navigate('/auth/login', { replace: true })
        }
      }
    }

    runLogout()

    return () => {
      isCancelled = true
    }
  }, [tokens?.refreshToken, logout, clearSession, navigate])

  return (
    <section className="page-card auth-page-card">
      <h1 className="auth-status-title">Signing out</h1>
      <p>Ending your session and returning to sign in...</p>
    </section>
  )
}

export default LogoutPage
