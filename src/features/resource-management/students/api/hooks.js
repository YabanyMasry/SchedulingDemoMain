import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../../../services/api'

const BASE = '/resource-management/students'

export const useStudentsQuery = () =>
  useQuery({
    queryKey: ['students'],
    queryFn: () => api.get(BASE).then((r) => r.data),
  })

// `enabled: Boolean(id)` prevents the query from firing until a valid ID is provided
export const useStudentQuery = (id) =>
  useQuery({
    queryKey: ['students', id],
    queryFn: () => api.get(`${BASE}/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  })

// Fetches all students belonging to a specific class; only fires when a classId is given
export const useStudentsByClassQuery = (classId) =>
  useQuery({
    queryKey: ['students', 'by-class', classId],
    queryFn: () =>
      api.get(`${BASE}/by-class/${classId}`).then((r) => r.data),
    enabled: Boolean(classId),
  })

export const useCreateStudentMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post(BASE, payload).then((r) => r.data),
    // Invalidate the list after any mutation so the UI always reflects server state
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  })
}

export const useUpdateStudentMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    // Destructure id out of the payload so it is used in the URL and not sent in the body
    mutationFn: ({ id, ...payload }) =>
      api.put(`${BASE}/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  })
}

// Soft delete: sets IsActive = false server-side; record is retained in the database
export const useDeactivateStudentMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  })
}

export const useActivateStudentMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.post(`${BASE}/${id}/activate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  })
}

// Hard delete: permanently removes the record from the database
export const useHardDeleteStudentMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/${id}/hard`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  })
}
