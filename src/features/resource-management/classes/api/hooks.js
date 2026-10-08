import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../../../services/api'

const BASE = '/resource-management/classes'

export const useClassesQuery = () =>
  useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get(BASE).then((r) => r.data),
  })

// `enabled: Boolean(id)` prevents the query from firing until a valid ID is provided
export const useClassQuery = (id) =>
  useQuery({
    queryKey: ['classes', id],
    queryFn: () => api.get(`${BASE}/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  })

export const useCreateClassMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post(BASE, payload).then((r) => r.data),
    // Invalidate the list after any mutation so the UI always reflects server state
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  })
}

export const useUpdateClassMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    // Destructure id out of the payload so it is used in the URL and not sent in the body
    mutationFn: ({ id, ...payload }) =>
      api.put(`${BASE}/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  })
}

// Soft delete: sets IsActive = false server-side; record is retained in the database
export const useDeactivateClassMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  })
}

export const useActivateClassMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.post(`${BASE}/${id}/activate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  })
}

// Hard delete: permanently removes the record from the database
export const useHardDeleteClassMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/${id}/hard`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  })
}

// --- Availability ---

export const useClassAvailabilityQuery = (classId) =>
  useQuery({
    queryKey: ['classes', classId, 'availability'],
    queryFn: () =>
      api.get(`${BASE}/${classId}/availability`).then((r) => r.data),
    enabled: Boolean(classId),
  })

// Availability is an upsert on the server: POST creates or overwrites the slot for
// the given (classId, dayOfWeek, periodId) combination
export const useSetClassAvailabilityMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ classId, ...payload }) =>
      api.post(`${BASE}/${classId}/availability`, payload).then((r) => r.data),
    onSuccess: (_, { classId }) =>
      qc.invalidateQueries({ queryKey: ['classes', classId, 'availability'] }),
  })
}

export const useRemoveClassAvailabilityMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ classId, availabilityId }) =>
      api
        .delete(`${BASE}/${classId}/availability/${availabilityId}`)
        .then((r) => r.data),
    onSuccess: (_, { classId }) =>
      qc.invalidateQueries({ queryKey: ['classes', classId, 'availability'] }),
  })
}
