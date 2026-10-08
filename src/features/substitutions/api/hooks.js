import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../../services/api'

const BASE = '/substitution'

// ─── Absences ───────────────────────────────────────────────────────────────

// Paginated absence list. `status` is the numeric AbsenceStatus; date filters are ISO strings.
export const useAbsencesQuery = ({ status, teacherId, from, to, page = 1, pageSize = 20 } = {}) =>
  useQuery({
    queryKey: ['absences', 'list', { status, teacherId, from, to, page, pageSize }],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (status) p.set('status', String(status))
      if (teacherId) p.set('teacherId', teacherId)
      if (from) p.set('from', from)
      if (to) p.set('to', to)
      return api.get(`${BASE}/absences?${p.toString()}`).then((r) => r.data)
    },
  })

// Lessons a teacher holds on a given date — drives the record-absence period picker (which
// periods will be missed) and the derived missed-hours total. Enabled once teacher + date are set.
export const useTeacherDayLessonsQuery = ({ teacherId, date }) =>
  useQuery({
    queryKey: ['teacher-day-lessons', teacherId, date],
    queryFn: () =>
      api.get(`${BASE}/absences/teacher-day-lessons?teacherId=${teacherId}&date=${date}`).then((r) => r.data),
    enabled: Boolean(teacherId && date),
  })

// One absence with its coverage records (affected lessons + substitution state).
export const useAbsenceQuery = (id) =>
  useQuery({
    queryKey: ['absences', id],
    queryFn: () => api.get(`${BASE}/absences/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  })

export const useRecordAbsenceMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post(`${BASE}/absences`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['absences'] }),
  })
}

// Confirm fans out one pending Substitution per affected lesson. `excludedScheduledLessonIds`
// drops lessons not actually affected (partial-day); omit for a whole-day absence.
export const useConfirmAbsenceMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, excludedScheduledLessonIds }) =>
      api
        .post(`${BASE}/absences/${id}/confirm`, {
          excludedScheduledLessonIds: excludedScheduledLessonIds ?? [],
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['absences'] })
      qc.invalidateQueries({ queryKey: ['daily-board'] })
    },
  })
}

export const useCloseAbsenceMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.post(`${BASE}/absences/${id}/close`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['absences'] }),
  })
}

// ─── Candidates + assignment ────────────────────────────────────────────────

// Ranked candidate substitutes for one affected lesson (feasible first, HC reasons attached).
export const useCandidatesQuery = (scheduledLessonId) =>
  useQuery({
    queryKey: ['sub-candidates', scheduledLessonId],
    queryFn: () =>
      api.get(`${BASE}/lessons/${scheduledLessonId}/candidates`).then((r) => r.data),
    enabled: Boolean(scheduledLessonId),
  })

// Assign a substitute (or record a teacher-less disposition). A hard-constraint clash returns
// 409 — the caller surfaces `error.response.data.code` (the violated HC codes) inline.
export const useAssignSubstituteMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ substitutionId, ...body }) =>
      api.post(`${BASE}/substitutions/${substitutionId}/assign`, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sub-candidates'] })
      qc.invalidateQueries({ queryKey: ['daily-board'] })
      qc.invalidateQueries({ queryKey: ['absences'] })
    },
  })
}

// ─── Appeals (teacher files, admin reviews) ─────────────────────────────────

// The calling teacher's own substitution assignments (ownership resolved server-side).
export const useMySubstitutionsQuery = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ['my-substitutions'],
    queryFn: () => api.get(`${BASE}/my-substitutions`).then((r) => r.data),
    enabled,
  })

// Teacher acknowledges/confirms an assignment. Admin sees it confirmed; it drops off the teacher's
// sidebar notifier.
export const useConfirmAssignmentMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (substitutionId) =>
      api.post(`${BASE}/substitutions/${substitutionId}/confirm`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-substitutions'] })
      qc.invalidateQueries({ queryKey: ['daily-board'] })
    },
  })
}

// Teacher files an appeal against a slot they were assigned. Does not unassign — flags for review.
export const useFileAppealMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ substitutionId, reason }) =>
      api.post(`${BASE}/substitutions/${substitutionId}/appeal`, { reason }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-substitutions'] }),
  })
}

// Admin appeal review queue (pending appeals).
export const useAppealsQuery = () =>
  useQuery({
    queryKey: ['appeals'],
    queryFn: () => api.get(`${BASE}/appeals`).then((r) => r.data),
  })

// Admin reviews an appeal. Approve → substitute unassigned back to pending; reject → stands.
export const useReviewAppealMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ substitutionId, approved, notes }) =>
      api
        .post(`${BASE}/substitutions/${substitutionId}/appeal/review`, { approved, notes: notes ?? null })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appeals'] })
      qc.invalidateQueries({ queryKey: ['daily-board'] })
      qc.invalidateQueries({ queryKey: ['absences'] })
    },
  })
}

// ─── Break supervision matrix ───────────────────────────────────────────────

export const useBreakDutiesQuery = ({ timetableId, includeInactive = false } = {}) =>
  useQuery({
    queryKey: ['break-duties', { timetableId, includeInactive }],
    queryFn: () => {
      const p = new URLSearchParams()
      if (timetableId) p.set('timetableId', timetableId)
      if (includeInactive) p.set('includeInactive', 'true')
      const qs = p.toString()
      return api.get(`${BASE}/break-duties${qs ? `?${qs}` : ''}`).then((r) => r.data)
    },
  })

export const useCreateBreakDutyMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post(`${BASE}/break-duties`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['break-duties'] }),
  })
}

export const useUpdateBreakDutyMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }) =>
      api.put(`${BASE}/break-duties/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['break-duties'] }),
  })
}

export const useDeactivateBreakDutyMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.post(`${BASE}/break-duties/${id}/deactivate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['break-duties'] }),
  })
}

// Per-date cover: assign a substitute supervisor to a break-duty cover row (from the board).
export const useAssignBreakSubstituteMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ breakSubstitutionId, substituteTeacherId, notes }) =>
      api
        .post(`${BASE}/break-substitutions/${breakSubstitutionId}/assign`, {
          substituteTeacherId,
          notes: notes ?? null,
        })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily-board'] }),
  })
}

// Teacher-less break-duty disposition (Cancelled / CombinedArea). `type` is the numeric enum.
export const useAssignBreakDispositionMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ breakSubstitutionId, type, notes }) =>
      api
        .post(`${BASE}/break-substitutions/${breakSubstitutionId}/disposition`, {
          type,
          notes: notes ?? null,
        })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily-board'] }),
  })
}

// ─── Daily board ────────────────────────────────────────────────────────────

// Date-pivoted cover monitor. `date` is an ISO date string (yyyy-mm-dd).
export const useDailyBoardQuery = (date) =>
  useQuery({
    queryKey: ['daily-board', date],
    queryFn: () => api.get(`${BASE}/board?date=${date}`).then((r) => r.data),
    enabled: Boolean(date),
  })

// ─── Analytics ──────────────────────────────────────────────────────────────

export const useAnalyticsQuery = ({ from, to } = {}) =>
  useQuery({
    queryKey: ['sub-analytics', from, to],
    queryFn: () => api.get(`${BASE}/analytics?from=${from}&to=${to}`).then((r) => r.data),
    enabled: Boolean(from && to),
  })
