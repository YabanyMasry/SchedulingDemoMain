import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../../../services/api'

const BASE = '/resource-management/departments'

export const useDepartmentsQuery = () =>
  useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get(BASE).then((r) => r.data),
  })

// `enabled: Boolean(id)` prevents the query from firing until a valid ID is provided,
// avoiding a malformed URL or a 400 response when id is undefined/null
export const useDepartmentQuery = (id) =>
  useQuery({
    queryKey: ['departments', id],
    queryFn: () => api.get(`${BASE}/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  })

export const useCreateDepartmentMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post(BASE, payload).then((r) => r.data),
    // Invalidate the list after any mutation so the UI always reflects server state
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  })
}

export const useUpdateDepartmentMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    // Destructure id out of the payload so it is used in the URL and not sent in the body
    mutationFn: ({ id, ...payload }) =>
      api.put(`${BASE}/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  })
}

// Soft delete: sets IsActive = false server-side; the record is not removed from the database
export const useDeactivateDepartmentMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  })
}

export const useActivateDepartmentMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.post(`${BASE}/${id}/activate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  })
}

// Hard delete: permanently removes the record from the database
export const useHardDeleteDepartmentMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/${id}/hard`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  })
}
