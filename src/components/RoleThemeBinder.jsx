import { useEffect } from 'react'
import { useAuth } from '../features/auth/context/useAuth'

const KNOWN_ROLES = new Set(['Admin', 'Teacher', 'Student'])

// Reads the active user's role and mirrors it onto <body data-role="...">. Every brand-themed
// CSS variable in index.css is keyed on that attribute, so flipping it here is the only thing
// that re-skins the whole app for a different role. Nothing else needs to know about themes.
//
// Defaults to "Admin" before sign-in and after sign-out so the auth screens, unauth fallbacks,
// and first-paint frames all stay on the orange baseline rather than briefly going untinted.
//
// Side-effect only — renders nothing.
const RoleThemeBinder = () => {
  const { user } = useAuth()
  const role = user?.role ?? user?.Role

  useEffect(() => {
    const body = document.body
    if (!body) return

    const next = role && KNOWN_ROLES.has(role) ? role : 'Admin'
    body.dataset.role = next

    // Don't strip on unmount — the binder is mounted once for the app's lifetime; clearing it
    // would briefly drop the theme between provider re-renders and isn't useful.
  }, [role])

  return null
}

export default RoleThemeBinder
