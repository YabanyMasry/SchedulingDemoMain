import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../../../services/api'

const BASE = '/resource-management/rooms'

export const useRoomsQuery = () =>
  useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get(BASE).then((r) => r.data),
  })

// `enabled: Boolean(id)` prevents the query from firing until a valid ID is provided
export const useRoomQuery = (id) =>
  useQuery({
    queryKey: ['rooms', id],
    queryFn: () => api.get(`${BASE}/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  })

export const useCreateRoomMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post(BASE, payload).then((r) => r.data),
    // Invalidate the list after any mutation so the UI always reflects server state
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  })
}

export const useUpdateRoomMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    // Destructure id out of the payload so it is used in the URL and not sent in the body
    mutationFn: ({ id, ...payload }) =>
      api.put(`${BASE}/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  })
}

// Soft delete: sets IsActive = false server-side; record is retained in the database
export const useDeactivateRoomMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  })
}

export const useActivateRoomMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.post(`${BASE}/${id}/activate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  })
}

// Hard delete: permanently removes the record from the database
export const useHardDeleteRoomMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/${id}/hard`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  })
}

// --- Availability ---

export const useRoomAvailabilityQuery = (roomId) =>
  useQuery({
    queryKey: ['rooms', roomId, 'availability'],
    queryFn: () =>
      api.get(`${BASE}/${roomId}/availability`).then((r) => r.data),
    enabled: Boolean(roomId),
  })

// Availability is an upsert on the server: POST creates or overwrites the slot for
// the given (roomId, dayOfWeek, periodId) combination
export const useSetRoomAvailabilityMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ roomId, ...payload }) =>
      api.post(`${BASE}/${roomId}/availability`, payload).then((r) => r.data),
    onSuccess: (_, { roomId }) =>
      qc.invalidateQueries({ queryKey: ['rooms', roomId, 'availability'] }),
  })
}

export const useRemoveRoomAvailabilityMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ roomId, availabilityId }) =>
      api
        .delete(`${BASE}/${roomId}/availability/${availabilityId}`)
        .then((r) => r.data),
    onSuccess: (_, { roomId }) =>
      qc.invalidateQueries({ queryKey: ['rooms', roomId, 'availability'] }),
  })
}
