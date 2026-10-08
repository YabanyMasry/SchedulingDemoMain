import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../../services/api'

const BASE = '/scheduling'

// Constructive build (Greedy / CSP). Returns { runId }.
export const useStartGenerationMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post(`${BASE}/generate`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['generation-runs'] }),
  })
}

// Simulated Annealing optimise of an already-placed timetable. Returns { runId }.
export const useOptimiseTimetableMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post(`${BASE}/optimise`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['generation-runs'] }),
  })
}

// Single run status. `pollWhileActive` turns on 2s polling until the run reaches a terminal state.
export const useGenerationRunQuery = (runId, { pollWhileActive = false } = {}) =>
  useQuery({
    queryKey: ['generation-runs', runId],
    queryFn: () => api.get(`${BASE}/runs/${runId}`).then((r) => r.data),
    enabled: Boolean(runId),
    refetchInterval: (query) => {
      if (!pollWhileActive) return false
      const status = query.state.data?.status
      return status === 'Running' || status === 'Pending' ? 2000 : false
    },
  })

const isActive = (r) => r.status === 'Running' || r.status === 'Pending'

// Paginated run history. Polls every 3s while any run on the page is still active.
export const useGenerationRunsQuery = ({ timetableId, page = 1, pageSize = 20 } = {}) =>
  useQuery({
    queryKey: ['generation-runs', 'list', timetableId ?? 'all', page, pageSize],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (timetableId) params.set('timetableId', timetableId)
      return api.get(`${BASE}/runs?${params.toString()}`).then((r) => r.data)
    },
    refetchInterval: (query) =>
      (query.state.data?.items ?? []).some(isActive) ? 3000 : false,
  })

export const useCancelRunMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (runId) => api.delete(`${BASE}/runs/${runId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['generation-runs'] }),
  })
}

// ─── Interactive move + swap-chain (RCR) ────────────────────────────────────
// `move` relocates a placed lesson to a (targetDay, targetPeriodId). The response is either
// { applied: true } (direct move persisted) or { applied: false, swapChain: [...] } when
// autoResolve found an ejection chain the admin must confirm via applySwapChain.
export const useMoveLessonMutation = () =>
  useMutation({
    mutationFn: ({ timetableId, scheduledLessonId, targetDay, targetPeriodId, autoResolve }) =>
      api
        .post(`${BASE}/move`, {
          timetableId,
          scheduledLessonId,
          targetDay,
          targetPeriodId,
          autoResolve: autoResolve ?? false,
        })
        .then((r) => r.data),
  })

// Persist a confirmed swap chain atomically. `moves` is the chain returned by `move`.
export const useApplySwapChainMutation = () =>
  useMutation({
    mutationFn: ({ timetableId, moves }) =>
      api.post(`${BASE}/swap-chains/apply`, { timetableId, moves }).then((r) => r.data),
  })
