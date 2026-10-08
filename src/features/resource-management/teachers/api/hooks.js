import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../../../services/api'

const BASE = '/resource-management/teachers'

export const useTeachersQuery = () =>
  useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get(BASE).then((r) => r.data),
  })

// `enabled: Boolean(id)` prevents the query from firing until a valid ID is provided,
// avoiding a malformed URL or a 400 response when id is undefined/null
export const useTeacherQuery = (id) =>
  useQuery({
    queryKey: ['teachers', id],
    queryFn: () => api.get(`${BASE}/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  })

export const useCreateTeacherMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post(BASE, payload).then((r) => r.data),
    // Invalidate the list after any mutation so the UI always reflects server state
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  })
}

export const useUpdateTeacherMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    // Destructure id out of the payload so it is used in the URL and not sent in the body
    mutationFn: ({ id, ...payload }) =>
      api.put(`${BASE}/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  })
}

// Soft delete: sets IsActive = false server-side; record is retained in the database
export const useDeactivateTeacherMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  })
}

export const useActivateTeacherMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.post(`${BASE}/${id}/activate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  })
}

// Hard delete: permanently removes the record from the database
export const useHardDeleteTeacherMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/${id}/hard`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  })
}

// Scheduling constraints (max periods/day, preferred load etc.) are updated separately
// from identity fields because they are typically managed by a different workflow/role
export const useSetTeacherConstraintsMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }) =>
      api.put(`${BASE}/${id}/constraints`, payload).then((r) => r.data),
    // Scope invalidation to just this teacher's detail cache entry, not the whole list
    onSuccess: (_, { id }) =>
      qc.invalidateQueries({ queryKey: ['teachers', id] }),
  })
}

// --- Availability ---

export const useTeacherAvailabilityQuery = (teacherId) =>
  useQuery({
    queryKey: ['teachers', teacherId, 'availability'],
    queryFn: () =>
      api.get(`${BASE}/${teacherId}/availability`).then((r) => r.data),
    enabled: Boolean(teacherId),
  })

// Availability is an upsert on the server: POST creates or overwrites the slot for
// the given (teacherId, dayOfWeek, periodId) combination
export const useSetTeacherAvailabilityMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ teacherId, ...payload }) =>
      api.post(`${BASE}/${teacherId}/availability`, payload).then((r) => r.data),
    onSuccess: (_, { teacherId }) =>
      qc.invalidateQueries({ queryKey: ['teachers', teacherId, 'availability'] }),
  })
}

export const useRemoveTeacherAvailabilityMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ teacherId, availabilityId }) =>
      api
        .delete(`${BASE}/${teacherId}/availability/${availabilityId}`)
        .then((r) => r.data),
    onSuccess: (_, { teacherId }) =>
      qc.invalidateQueries({ queryKey: ['teachers', teacherId, 'availability'] }),
  })
}

// --- Subject qualifications ---

export const useTeacherSubjectsQuery = (teacherId) =>
  useQuery({
    queryKey: ['teachers', teacherId, 'subjects'],
    queryFn: () =>
      api.get(`${BASE}/${teacherId}/subjects`).then((r) => r.data),
    enabled: Boolean(teacherId),
  })

export const useAddTeacherSubjectMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ teacherId, ...payload }) =>
      api.post(`${BASE}/${teacherId}/subjects`, payload).then((r) => r.data),
    onSuccess: (_, { teacherId }) =>
      qc.invalidateQueries({ queryKey: ['teachers', teacherId, 'subjects'] }),
  })
}

export const useRemoveTeacherSubjectMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ teacherId, subjectId }) =>
      api
        .delete(`${BASE}/${teacherId}/subjects/${subjectId}`)
        .then((r) => r.data),
    onSuccess: (_, { teacherId }) =>
      qc.invalidateQueries({ queryKey: ['teachers', teacherId, 'subjects'] }),
  })
}
