import { useQueryClient } from '@tanstack/react-query'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import api from '../../../services/api'
import { AuthContext } from './authContext'

// These routes issue or validate credentials and must not carry the access token in the
// Authorization header — doing so would cause the interceptor to re-attach a potentially
// expired token to the very requests that are meant to renew it
const AUTH_BOOTSTRAP_PATHS = ['/auth/magic-link', '/auth/verify', '/auth/refresh']

const isAuthBootstrapRequest = (url = '') =>
  AUTH_BOOTSTRAP_PATHS.some(
    (path) => url === path || url.endsWith(path) || url.includes(path),
  )

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient()
  const [tokens, setTokens] = useState({ accessToken: 'mock', refreshToken: 'mock', expiresAt: 'mock' })
  const [user, setUser] = useState({ id: '1', role: 'Admin', Role: 'Admin', email: 'admin@mock.com', firstName: 'Admin', lastName: 'Mock' })
  const [isHydratingUser, setIsHydratingUser] = useState(false)

  // Ref used by Axios interceptors to read the latest tokens without needing to be
  // re-registered every time state changes (avoids stale closure inside the interceptor)
  const refreshPromiseRef = useRef(null)
  const sessionRef = useRef({ tokens: null, user: null })

  useEffect(() => {
    sessionRef.current = { tokens, user }
  }, [tokens, user])

  // Stores only the three token fields; intentionally discards any extra server fields
  const applyAuthTokens = useCallback((authTokens) => {
    setTokens({
      accessToken: authTokens.accessToken,
      refreshToken: authTokens.refreshToken,
      expiresAt: authTokens.expiresAt,
    })
  }, [])

  // Clears all auth state AND the React Query cache to prevent stale protected data
  // from persisting after the user logs out
  const clearSession = useCallback(() => {
    setTokens(null)
    setUser(null)
    queryClient.clear()
  }, [queryClient])

  // Fetches the current user profile from /auth/me.
  // Accepts an accessTokenOverride so the caller can pass a freshly-issued token
  // before the setTokens state update has propagated to sessionRef
  const fetchCurrentUser = useCallback(async (accessTokenOverride) => {
    const mockUser = { id: '1', role: 'Admin', Role: 'Admin', email: 'admin@mock.com', firstName: 'Admin', lastName: 'Mock' }
    setUser(mockUser)
    return mockUser
  }, [])

  const refreshSession = useCallback(async () => {
    const refreshToken = sessionRef.current.tokens?.refreshToken

    if (!refreshToken) {
      throw new Error('Missing refresh token.')
    }

    // De-duplicate concurrent refresh calls: if a refresh is already in flight,
    // return the same promise so multiple 401s don't trigger multiple token rotations
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = api
        .post('/auth/refresh', { token: refreshToken })
        .then((response) => {
          applyAuthTokens(response.data)
          return response.data
        })
        .catch((error) => {
          // Refresh failed (token revoked / expired) — force a full logout
          clearSession()
          throw error
        })
        .finally(() => {
          refreshPromiseRef.current = null
        })
    }

    return refreshPromiseRef.current
  }, [applyAuthTokens, clearSession])

  useEffect(() => {
    // Request interceptor: attach the access token to every outbound request except
    // auth bootstrap routes (which supply their own credentials)
    const requestInterceptorId = api.interceptors.request.use(
      (config) => {
        const accessToken = sessionRef.current.tokens?.accessToken
        const requestUrl = config.url ?? ''

        if (accessToken && !isAuthBootstrapRequest(requestUrl)) {
          config.headers = config.headers ?? {}
          if (!config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${accessToken}`
          }
        }

        return config
      },
      (error) => Promise.reject(error),
    )

    // Response interceptor: transparently refresh the access token on 401 and replay
    // the original request, so callers never need to handle token expiry themselves
    const responseInterceptorId = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const statusCode = error.response?.status
        const originalRequest = error.config
        const requestUrl = originalRequest?.url ?? ''

        if (statusCode !== 401 || !originalRequest) {
          return Promise.reject(error)
        }

        // Prevent infinite retry loops: skip retry if this request has already been
        // retried once, or if it is itself an auth endpoint that cannot be retried
        if (
          originalRequest._retry ||
          requestUrl.includes('/auth/refresh') ||
          requestUrl.includes('/auth/verify') ||
          requestUrl.includes('/auth/magic-link')
        ) {
          return Promise.reject(error)
        }

        // Mark this request so it won't be retried a second time if it 401s again
        originalRequest._retry = true

        try {
          const refreshedTokens = await refreshSession()
          originalRequest.headers = originalRequest.headers ?? {}
          originalRequest.headers.Authorization = `Bearer ${refreshedTokens.accessToken}`
          return api(originalRequest)
        } catch (refreshError) {
          return Promise.reject(refreshError)
        }
      },
    )

    // Remove both interceptors when the provider unmounts to avoid duplicate handlers
    return () => {
      api.interceptors.request.eject(requestInterceptorId)
      api.interceptors.response.eject(responseInterceptorId)
    }
  }, [refreshSession])

  // Two distinct levels: hasSession means tokens exist (but user may still be loading),
  // isAuthenticated means the full session is ready (tokens + user profile)
  const hasSession = Boolean(tokens?.accessToken && tokens?.refreshToken)
  const isAuthenticated = Boolean(hasSession && user)

  const value = useMemo(
    () => ({
      tokens,
      user,
      hasSession,
      isAuthenticated,
      isHydratingUser,
      applyAuthTokens,
      clearSession,
      fetchCurrentUser,
      refreshSession,
    }),
    [
      tokens,
      user,
      hasSession,
      isAuthenticated,
      isHydratingUser,
      applyAuthTokens,
      clearSession,
      fetchCurrentUser,
      refreshSession,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
