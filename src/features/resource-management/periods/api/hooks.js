import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../../../services/api'

const BASE = '/resource-management/periods'

export const usePeriodsQuery = () =>
  useQuery({
    queryKey: ['periods'],
    queryFn: () => api.get(BASE).then((r) => r.data),
  })

// `enabled: Boolean(id)` prevents the query from firing until a valid ID is provided
export const usePeriodQuery = (id) =>
  useQuery({
    queryKey: ['periods', id],
    queryFn: () => api.get(`${BASE}/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  })

export const useCreatePeriodMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post(BASE, payload).then((r) => r.data),
    // Invalidate the list after any mutation so the UI always reflects server state
    onSuccess: () => qc.invalidateQueries({ queryKey: ['periods'] }),
  })
}

export const useUpdatePeriodMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    // Destructure id out of the payload so it is used in the URL and not sent in the body
    mutationFn: ({ id, ...payload }) =>
      api.put(`${BASE}/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['periods'] }),
  })
}

// Soft delete: sets IsActive = false server-side; record is retained in the database
export const useDeactivatePeriodMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['periods'] }),
  })
}

export const useActivatePeriodMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.post(`${BASE}/${id}/activate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['periods'] }),
  })
}

// Hard delete: permanently removes the record from the database
export const useHardDeletePeriodMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/${id}/hard`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['periods'] }),
  })
}
