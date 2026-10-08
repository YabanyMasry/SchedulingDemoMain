import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { motion } from 'motion/react'
import { IconCalendarTime, IconLayoutDashboard, IconBuildingCommunity, IconArrowsExchange, IconAdjustmentsHorizontal, IconUserCircle } from '@tabler/icons-react'
import { Sidebar, SidebarBody, SidebarLink, SidebarProfile } from './ui/sidebar'
import { cn } from '../lib/utils'
import { useAuth } from '../features/auth/context/useAuth'
import { useMySubstitutionsQuery } from '../features/substitutions/api/hooks'
import './AppLayout.css'

// Navigation is role-scoped: admins get the full operations suite, teachers and
// students only see their own data. Backed by matching route guards and API policies.
const adminLinks = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <IconLayoutDashboard className="h-5 w-5 shrink-0 text-white" />,
  },
  {
    label: 'Timetable',
    href: '/timetable',
    icon: <IconCalendarTime className="h-5 w-5 shrink-0 text-white" />,
  },
  {
    label: 'Resource Management',
    href: '/resource-management',
    icon: <IconBuildingCommunity className="h-5 w-5 shrink-0 text-white" />,
  },
  {
    label: 'Substitutions',
    href: '/substitutions',
    icon: <IconArrowsExchange className="h-5 w-5 shrink-0 text-white" />,
  },
  {
    label: 'System',
    href: '/system',
    icon: <IconAdjustmentsHorizontal className="h-5 w-5 shrink-0 text-white" />,
  },
]

const teacherLinks = [
  {
    label: 'My Schedule',
    href: '/my/schedule',
    icon: <IconCalendarTime className="h-5 w-5 shrink-0 text-white" />,
  },
  {
    label: 'My Profile',
    href: '/my/profile',
    icon: <IconUserCircle className="h-5 w-5 shrink-0 text-white" />,
  },
  {
    label: 'My Substitutions',
    href: '/substitutions/mine',
    icon: <IconArrowsExchange className="h-5 w-5 shrink-0 text-white" />,
  },
]

const studentLinks = [
  {
    label: 'My Schedule',
    href: '/my/schedule',
    icon: <IconCalendarTime className="h-5 w-5 shrink-0 text-white" />,
  },
]

const linksForRole = (role) => {
  if (role === 'Admin') return adminLinks
  if (role === 'Teacher') return teacherLinks
  return studentLinks
}

const Logo = () => {
  return (
    <Link
      to="/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-white"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-white" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-white"
      >
        School Portal
      </motion.span>
    </Link>
  )
}

const LogoIcon = () => {
  return (
    <Link
      to="/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-white"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-white" />
    </Link>
  )
}

const getInitialsFromEmail = (email = '') => {
  const localPart = email.split('@')[0]?.trim()

  if (!localPart) {
    return 'U'
  }

  const tokens = localPart.split(/[._-]+/).filter(Boolean)

  if (tokens.length >= 2) {
    return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase()
  }

  return localPart.slice(0, 2).toUpperCase()
}

const getDisplayNameFromEmail = (email = '') => {
  const localPart = email.split('@')[0]?.trim()

  if (!localPart) {
    return 'User'
  }

  return localPart.replace(/[._-]+/g, ' ')
}

const AppLayout = () => {
  const [open, setOpen] = useState(false)
  const { user, hasSession, isHydratingUser, fetchCurrentUser } = useAuth()

  useEffect(() => {
    if (!user && hasSession && !isHydratingUser) {
      fetchCurrentUser().catch(() => {
        // Route guards will handle invalid/expired sessions.
      })
    }
  }, [user, hasSession, isHydratingUser, fetchCurrentUser])

  const userEmail = user?.email ?? user?.Email ?? ''
  const displayName = getDisplayNameFromEmail(userEmail)
  const avatarInitials = getInitialsFromEmail(userEmail)
  const role = user?.role ?? user?.Role
  const isTeacher = role === 'Teacher'

  // Teacher-only: badge "My Substitutions" with the count of upcoming, not-yet-confirmed
  // assignments — once the teacher confirms a slot it drops off the notifier.
  const { data: mySubs } = useMySubstitutionsQuery({ enabled: isTeacher })
  const upcomingSubs = (mySubs ?? []).filter(
    (s) => !s.isConfirmed && (!s.lessonStart || new Date(s.lessonStart) > new Date()),
  ).length

  const links = linksForRole(role).map((link) =>
    isTeacher && link.href === '/substitutions/mine' && upcomingSubs > 0
      ? { ...link, badge: upcomingSubs }
      : link,
  )

  return (
    <div className={cn('app-shell')}>
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>

            <div className="mt-auto border-t border-white/20 pt-4">
              <SidebarProfile
                profile={{
                  initials: avatarInitials,
                  name: displayName,
                  email: userEmail || 'No email',
                  logoutHref: '/auth/logout',
                }}
              />
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
