import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useVerifyMagicLinkMutation } from '../api/hooks'
import { useAuth } from '../context/useAuth'
import { getAuthErrorMessage } from '../lib/errors'

const attemptedVerificationTokens = new Set()

const VerifyPage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const navigate = useNavigate()
  const { applyAuthTokens, fetchCurrentUser, clearSession } = useAuth()
  const { mutateAsync: verifyMagicLink } = useVerifyMagicLinkMutation()
  const [status, setStatus] = useState(token ? 'verifying' : 'error')
  const [message, setMessage] = useState(
    token
      ? 'Verifying your link...'
      : 'This link is missing a token. Request a new magic link.',
  )

  useEffect(() => {
    if (!token) {
      return
    }

    if (attemptedVerificationTokens.has(token)) {
      return
    }

    attemptedVerificationTokens.add(token)

    let isCancelled = false

    const verify = async () => {
      setStatus('verifying')
      setMessage('Verifying your link...')

      try {
        const authTokens = await verifyMagicLink(token)
        applyAuthTokens(authTokens)
        await fetchCurrentUser(authTokens.accessToken)

        if (isCancelled) {
          return
        }

        setStatus('success')
        setMessage('Verification successful. Redirecting to dashboard...')
        navigate('/dashboard', { replace: true })
      } catch (error) {
        clearSession()

        if (!error?.response) {
          attemptedVerificationTokens.delete(token)
        }

        if (isCancelled) {
          return
        }

        setStatus('error')
        setMessage(
          getAuthErrorMessage(
            error,
            'Verification failed. Request a new magic link.',
          ),
        )
      }
    }

    verify()

    return () => {
      isCancelled = true
    }
  }, [
    token,
    verifyMagicLink,
    applyAuthTokens,
    fetchCurrentUser,
    clearSession,
    navigate,
  ])

  return (
    <section className="page-card auth-page-card">
      <h1 className="auth-status-title">Magic link verification</h1>
      <p>{message}</p>

      {status === 'error' ? (
        <p className="auth-link-row">
          <Link to="/auth/login" className="auth-link">
            Back to sign in
          </Link>
        </p>
      ) : null}
    </section>
  )
}

export default VerifyPage
