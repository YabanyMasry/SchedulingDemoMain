import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../../../services/api'

const BASE = '/timetable'

export const useSchoolYearsQuery = () =>
  useQuery({
    queryKey: ['schoolYears'],
    queryFn: () => api.get(`${BASE}/school-years`).then((r) => r.data),
  })

export const useCreateSchoolYearMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post(`${BASE}/school-years`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schoolYears'] }),
  })
}

export const useUpdateSchoolYearMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }) =>
      api.put(`${BASE}/school-years/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schoolYears'] }),
  })
}

export const useDeleteSchoolYearMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/school-years/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schoolYears'] }),
  })
}

export const useTermsQuery = (schoolYearId) =>
  useQuery({
    queryKey: ['terms', schoolYearId ?? 'all'],
    queryFn: () => {
      const url = schoolYearId
        ? `${BASE}/terms?schoolYearId=${schoolYearId}`
        : `${BASE}/terms`
      return api.get(url).then((r) => r.data)
    },
  })

export const useCreateTermMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post(`${BASE}/terms`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['terms'] }),
  })
}

export const useUpdateTermMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }) =>
      api.put(`${BASE}/terms/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['terms'] }),
  })
}

export const useDeleteTermMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/terms/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['terms'] }),
  })
}
