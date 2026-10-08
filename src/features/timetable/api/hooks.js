import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../../services/api'

const BASE = '/timetable'

export const useTimetablesQuery = (schoolYearId) =>
  useQuery({
    queryKey: ['timetables', schoolYearId ?? 'all'],
    queryFn: () => {
      const url = schoolYearId
        ? `${BASE}?schoolYearId=${schoolYearId}`
        : BASE
      return api.get(url).then((r) => r.data)
    },
  })

export const useTimetableQuery = (id) =>
  useQuery({
    queryKey: ['timetables', id],
    queryFn: () => api.get(`${BASE}/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  })

export const useCreateTimetableMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post(BASE, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetables'] }),
  })
}

export const useRenameTimetableMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, newName }) =>
      api.put(`${BASE}/${id}/rename`, { newName }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetables'] }),
  })
}

export const usePublishTimetableMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.post(`${BASE}/${id}/publish`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetables'] }),
  })
}

export const useArchiveTimetableMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.post(`${BASE}/${id}/archive`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetables'] }),
  })
}

export const useUnarchiveTimetableMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.post(`${BASE}/${id}/unarchive`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetables'] }),
  })
}

export const useDeleteTimetableMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetables'] }),
  })
}

export const useCopyTimetableMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, newName }) =>
      api.post(`${BASE}/${id}/copy`, { newName: newName ?? null }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetables'] }),
  })
}

// ─── Scheduled lessons (editor grid) ────────────────────────────────────────
// The grid read is admin-only and returns every placement (any status), unlike `/my`.

export const useTimetableGridQuery = (timetableId) =>
  useQuery({
    queryKey: ['timetable-grid', timetableId],
    queryFn: () =>
      api.get(`${BASE}/${timetableId}/scheduled-lessons`).then((r) => r.data),
    enabled: Boolean(timetableId),
  })

// Read-only personal timetable (teacher/student). Admin receives 403.
export const useMyTimetableQuery = () =>
  useQuery({
    queryKey: ['my-timetable'],
    queryFn: () => api.get(`${BASE}/my`).then((r) => r.data),
    retry: false,
  })

const invalidateGrid = (qc, timetableId) =>
  qc.invalidateQueries({ queryKey: ['timetable-grid', timetableId] })

// Place a lesson. On a hard-constraint conflict the API returns 409 with
// { violations: [...], ignorable: true }; callers inspect error.response.data.violations
// and may resubmit with ignoredConstraints to override.
export const useAddScheduledLessonMutation = (timetableId) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ lessonId, dayOfWeek, periodId, roomIds, ignoredConstraints }) =>
      api
        .post(`${BASE}/${timetableId}/scheduled-lessons`, {
          lessonId,
          dayOfWeek,
          periodId,
          roomIds,
          ignoredConstraints: ignoredConstraints ?? null,
        })
        .then((r) => r.data),
    onSuccess: () => invalidateGrid(qc, timetableId),
  })
}

export const useMoveScheduledLessonMutation = (timetableId) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dayOfWeek, periodId, roomIds, ignoredConstraints }) =>
      api
        .put(`${BASE}/scheduled-lessons/${id}`, {
          dayOfWeek,
          periodId,
          roomIds,
          ignoredConstraints: ignoredConstraints ?? null,
        })
        .then((r) => r.data),
    onSuccess: () => invalidateGrid(qc, timetableId),
  })
}

export const useRemoveScheduledLessonMutation = (timetableId) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) =>
      api.delete(`${BASE}/scheduled-lessons/${id}`).then((r) => r.data),
    onSuccess: () => invalidateGrid(qc, timetableId),
  })
}

// Conflict-free (day, period) cells for a placed lesson, keeping its current rooms.
// Modelled as a mutation (imperative fetch) — results go stale the moment the grid
// changes, so caching them under a query key would only serve wrong answers.
export const useAvailableSlotsMutation = () =>
  useMutation({
    mutationFn: (scheduledLessonId) =>
      api
        .get(`${BASE}/scheduled-lessons/${scheduledLessonId}/available-slots`)
        .then((r) => r.data),
  })

export const useSetScheduledLessonLockMutation = (timetableId) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isLocked }) =>
      api
        .post(`${BASE}/scheduled-lessons/${id}/lock`, { isLocked })
        .then((r) => r.data),
    onSuccess: () => invalidateGrid(qc, timetableId),
  })
}
