// Enum maps mirror the backend Substitution.Domain enums. The API has no string-enum JSON
// converter, so request bodies must carry the NUMERIC value; responses come back as the member
// NAME (DTOs project `.ToString()`). Keep both directions here so pages map cleanly each way.

export const ABSENCE_TYPES = [
  { value: 1, label: 'Sick' },
  { value: 2, label: 'Personal' },
  { value: 3, label: 'Professional' },
  { value: 4, label: 'Meeting' },
  { value: 5, label: 'Emergency' },
  { value: 6, label: 'Vacation' },
  { value: 7, label: 'Administrative Duty' },
  { value: 8, label: 'Other' },
]

export const ABSENCE_STATUSES = [
  { value: 1, label: 'Reported' },
  { value: 2, label: 'Confirmed' },
  { value: 3, label: 'BeingCovered' },
  { value: 4, label: 'Covered' },
  { value: 5, label: 'PartiallyCovered' },
  { value: 6, label: 'NotCovered' },
]

// Assignment dispositions. TeacherSubstitute / SelfStudy require a substitute teacher;
// the rest are teacher-less (handled server-side without an HC placement check).
export const SUBSTITUTION_TYPES = [
  { value: 1, label: 'Teacher Substitute', needsTeacher: true },
  { value: 3, label: 'Self Study (supervised)', needsTeacher: true },
  { value: 2, label: 'Class Merger', needsTeacher: false },
  { value: 5, label: 'Room Change', needsTeacher: false },
  { value: 4, label: 'Cancelled', needsTeacher: false },
  { value: 6, label: 'Rescheduled', needsTeacher: false },
]

// School week — duty matrix day columns (Sunday–Thursday).
export const SCHOOL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']

// Teacher-less break-duty dispositions (numeric SupervisionSubstitutionType).
export const SUPERVISION_DISPOSITIONS = [
  { value: 2, label: 'Cancelled' },
  { value: 3, label: 'Combined Area' },
]

// Capacity codes are the only HC codes a force-assign may override (clash codes never).
export const CAPACITY_OVERRIDE_CODES = ['HC-8', 'HC-11', 'HC-12']

export const canForceAssign = (codes) =>
  Array.isArray(codes) && codes.length > 0 && codes.every((c) => CAPACITY_OVERRIDE_CODES.includes(c))

// Coverage / absence status → badge colour. Keys match the string names the API returns.
export const STATUS_COLORS = {
  PendingAssignment: '#b45309',
  Pending: '#b45309',
  Reported: '#6b7280',
  Confirmed: '#2563eb',
  BeingCovered: '#2563eb',
  TeacherSubstitute: '#16a34a',
  SelfStudy: '#16a34a',
  Covered: '#16a34a',
  Cancelled: '#dc2626',
  NotCovered: '#dc2626',
  ClassMerger: '#7c3aed',
  RoomChange: '#0891b2',
  Rescheduled: '#0891b2',
  PartiallyCovered: '#b45309',
  // Appeal statuses
  Requested: '#b45309',
  Approved: '#16a34a',
  Rejected: '#6b7280',
}

export const statusColor = (s) => STATUS_COLORS[s] ?? '#6b7280'

export const toIsoDate = (d) => {
  if (!d) return ''
  const date = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}
