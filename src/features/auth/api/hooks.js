import { useMutation } from '@tanstack/react-query'
import api from '../../../services/api'

// Submits an email and asks the server to send a magic link.
// Always returns 200 from the API regardless of whether the email exists (prevents enumeration).
export const useRequestMagicLinkMutation = () =>
  useMutation({
    mutationFn: async ({ email }) => {
      const response = await api.post('/auth/magic-link', { email })
      return response.data
    },
  })

// Exchanges the raw token from the magic link URL for a JWT access token + refresh token pair
export const useVerifyMagicLinkMutation = () =>
  useMutation({
    mutationFn: async (token) => {
      const response = await api.post('/auth/verify', { token })
      return response.data
    },
  })

// Rotates the refresh token: the old token is invalidated and a new pair is returned.
// Called without an Authorization header because the access token may already be expired.
export const useRefreshTokenMutation = () =>
  useMutation({
    mutationFn: async (token) => {
      const response = await api.post('/auth/refresh', { token })
      return response.data
    },
  })

// Revokes the entire refresh token family server-side so the session cannot be resumed
export const useLogoutMutation = () =>
  useMutation({
    mutationFn: async (refreshToken) => {
      const response = await api.post('/auth/logout', { refreshToken })
      return response.data
    },
  })
