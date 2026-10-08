// Landing page per role: admins operate the system, teachers/students view their own data
export const homePathForRole = (role) =>
  role === 'Admin' ? '/dashboard' : '/my/schedule'
