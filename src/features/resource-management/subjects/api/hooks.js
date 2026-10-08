import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../../../services/api'

const BASE = '/resource-management/subjects'

export const useSubjectsQuery = () =>
  useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get(BASE).then((r) => r.data),
  })

// `enabled: Boolean(id)` prevents the query from firing until a valid ID is provided
export const useSubjectQuery = (id) =>
  useQuery({
    queryKey: ['subjects', id],
    queryFn: () => api.get(`${BASE}/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  })

export const useCreateSubjectMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post(BASE, payload).then((r) => r.data),
    // Invalidate the list after any mutation so the UI always reflects server state
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  })
}

export const useUpdateSubjectMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    // Destructure id out of the payload so it is used in the URL and not sent in the body
    mutationFn: ({ id, ...payload }) =>
      api.put(`${BASE}/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  })
}

// Soft delete: sets IsActive = false server-side; record is retained in the database
export const useDeactivateSubjectMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  })
}

export const useActivateSubjectMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.post(`${BASE}/${id}/activate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  })
}

// Hard delete: permanently removes the record from the database
export const useHardDeleteSubjectMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/${id}/hard`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  })
}

// --- Availability ---

export const useSubjectAvailabilityQuery = (subjectId) =>
  useQuery({
    queryKey: ['subjects', subjectId, 'availability'],
    queryFn: () =>
      api.get(`${BASE}/${subjectId}/availability`).then((r) => r.data),
    enabled: Boolean(subjectId),
  })

// Availability is an upsert on the server: POST creates or overwrites the slot for
// the given (subjectId, dayOfWeek, periodId) combination
export const useSetSubjectAvailabilityMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ subjectId, ...payload }) =>
      api
        .post(`${BASE}/${subjectId}/availability`, payload)
        .then((r) => r.data),
    onSuccess: (_, { subjectId }) =>
      qc.invalidateQueries({
        queryKey: ['subjects', subjectId, 'availability'],
      }),
  })
}

export const useRemoveSubjectAvailabilityMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ subjectId, availabilityId }) =>
      api
        .delete(`${BASE}/${subjectId}/availability/${availabilityId}`)
        .then((r) => r.data),
    onSuccess: (_, { subjectId }) =>
      qc.invalidateQueries({
        queryKey: ['subjects', subjectId, 'availability'],
      }),
  })
}
