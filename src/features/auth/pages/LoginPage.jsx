import { useState } from 'react'
import { useRequestMagicLinkMutation } from '../api/hooks'
import { getAuthErrorMessage } from '../lib/errors'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [devMagicLink, setDevMagicLink] = useState(null)
  const requestMagicLinkMutation = useRequestMagicLinkMutation()

  const handleSubmit = async (event) => {
    event.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setFeedback({
        type: 'error',
        message: 'Email is required.',
      })
      return
    }

    setFeedback(null)
    setDevMagicLink(null)

    try {
      const response = await requestMagicLinkMutation.mutateAsync({
        email: normalizedEmail,
      })

      // In dev mode, the backend returns the magic link URL directly
      if (response?.devMagicLink) {
        setDevMagicLink(response.devMagicLink)
      }

      setFeedback({
        type: 'success',
        message:
          response?.message ??
          'If that email is registered, a magic link has been sent.',
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getAuthErrorMessage(
          error,
          'Could not send magic link. Please try again.',
        ),
      })
    }
  }

  return (
    <section className="page-card auth-page-card">
      <h1>Sign in with magic link</h1>
      <p>
        Enter your school email and we will send you a one-time sign-in link.
      </p>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <label htmlFor="email" className="auth-label">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="pill-input"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          maxLength={320}
          required
          placeholder="name@school.edu"
        />

        <div className="auth-actions">
          <button
            className="pill-button"
            type="submit"
            disabled={requestMagicLinkMutation.isPending}
          >
            {requestMagicLinkMutation.isPending
              ? 'Sending magic link...'
              : 'Send magic link'}
          </button>
        </div>

        <p className="auth-note">
          For security, the response is always generic even when an email is not
          registered.
        </p>
      </form>

      {feedback ? (
        <p
          className={`auth-feedback ${
            feedback.type === 'success'
              ? 'auth-feedback-success'
              : 'auth-feedback-error'
          }`}
          role="status"
        >
          {feedback.message}
        </p>
      ) : null}

      {devMagicLink ? (
        <div className="dev-magic-link-section" style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#1e40af', marginBottom: '0.75rem' }}>
            <strong>🔧 Dev Mode:</strong> Click the link below to complete sign-in:
          </p>
          <a
            href={devMagicLink}
            className="pill-button"
            style={{
              display: 'inline-block',
              textDecoration: 'none',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
            }}
          >
            ✓ Click to verify
          </a>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
            This link will expire in 15 minutes.
          </p>
        </div>
      ) : null}
    </section>
  )
}

export default LoginPage
