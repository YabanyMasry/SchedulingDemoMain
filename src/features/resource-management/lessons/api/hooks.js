import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../../../services/api'

const BASE = '/timetable/lessons'

export const useLessonsQuery = () =>
  useQuery({
    queryKey: ['lessons'],
    queryFn: () => api.get(BASE).then((r) => r.data),
  })

export const useLessonQuery = (id) =>
  useQuery({
    queryKey: ['lessons', id],
    queryFn: () => api.get(`${BASE}/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  })

export const useCreateLessonMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post(BASE, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

export const useUpdateLessonMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }) =>
      api.put(`${BASE}/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

export const useSetLessonActiveMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }) =>
      api.post(`${BASE}/${id}/active`, { isActive }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

export const useDeleteLessonMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

// --- Lesson membership (junctions) ---

export const useAddLessonTeacherMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ lessonId, teacherId }) =>
      api.post(`${BASE}/${lessonId}/teachers`, { id: teacherId }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

export const useRemoveLessonTeacherMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ lessonId, teacherId }) =>
      api.delete(`${BASE}/${lessonId}/teachers/${teacherId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

export const useAddLessonClassMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ lessonId, classId }) =>
      api.post(`${BASE}/${lessonId}/classes`, { id: classId }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

export const useRemoveLessonClassMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ lessonId, classId }) =>
      api.delete(`${BASE}/${lessonId}/classes/${classId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

export const useAddLessonSubjectMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ lessonId, subjectId }) =>
      api.post(`${BASE}/${lessonId}/subjects`, { id: subjectId }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

export const useRemoveLessonSubjectMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ lessonId, subjectId }) =>
      api.delete(`${BASE}/${lessonId}/subjects/${subjectId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

// Replaces a lesson's full set of teacher→subject pairings (informational mapping for
// multi-subject / co-taught lessons). `assignments` is [{ teacherId, subjectId }].
export const useSetLessonAssignmentsMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ lessonId, assignments }) =>
      api.put(`${BASE}/${lessonId}/assignments`, { assignments }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons'] }),
  })
}
