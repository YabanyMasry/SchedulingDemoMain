import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../../services/api'

const BASE = '/resource-management/teachers/me'

// The backend resolves which teacher "me" is from the JWT — no id is ever sent
export const useMyTeacherProfileQuery = (enabled = true) =>
  useQuery({
    queryKey: ['my-teacher-profile'],
    queryFn: () => api.get(BASE).then((r) => r.data),
    enabled,
  })

export const useUpdateMyTeacherProfileMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.put(BASE, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-teacher-profile'] }),
  })
}
