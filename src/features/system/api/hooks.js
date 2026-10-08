import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../../services/api'

const PENDING_USERS_QUERY_KEY = ['system', 'pending-users']

// Defensive normalizer: the API may return either camelCase or PascalCase field names
// depending on the serializer configuration, so both variants are tried for each field.
// Users without an id are filtered out to avoid rendering broken rows in the approval table.
const normalizePendingUsers = (users) =>
  (Array.isArray(users) ? users : [])
    .map((user) => ({
      id: user?.id ?? user?.Id,
      email: user?.email ?? user?.Email ?? '',
      name: user?.name ?? user?.Name ?? '',
    }))
    .filter((user) => Boolean(user.id))

export const usePendingUsersQuery = () =>
  useQuery({
    queryKey: PENDING_USERS_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get('/admin/users/pending')
      const payload = response.data
      // The API may return a bare array or a { value: [...] } envelope depending on the serializer
      const users = Array.isArray(payload) ? payload : payload?.value ?? []
      return normalizePendingUsers(users)
    },
  })

export const useApprovePendingUserMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, payload }) => {
      await api.post(`/admin/users/${userId}/approve`, payload)
    },
    // Refresh the pending list after approval so the approved user disappears from the table
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_USERS_QUERY_KEY })
    },
  })
}

// Uploads a CSV file to the resource bulk-import endpoint. `resourceType` is one of
// teachers | students | classes | subjects | rooms. Returns the per-row import result
// { total, imported, failed, errors: [{ row, message }] }. axios 1.x adds the multipart
// boundary automatically for a FormData body; the request interceptor attaches the JWT.
export const useImportCsvMutation = () =>
  useMutation({
    mutationFn: async ({ resourceType, file }) => {
      const form = new FormData()
      form.append('file', file)
      const response = await api.post(`/resource-management/import/${resourceType}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    },
  })

export const useRejectPendingUserMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId) => {
      await api.post(`/admin/users/${userId}/reject`)
    },
    // Refresh the pending list after rejection so the rejected user disappears from the table
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_USERS_QUERY_KEY })
    },
  })
}
