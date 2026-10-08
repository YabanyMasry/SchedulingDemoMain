import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IconBolt, IconSparkles } from '@tabler/icons-react'
import { useGenerationRunsQuery, useCancelRunMutation } from '../api/hooks'

const STATUS_COLORS = {
  Running: '#2563eb', Pending: '#6b7280', Completed: '#16a34a', Failed: '#dc2626', Cancelled: '#b45309',
}

const fmt = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

const StatusBadge = ({ status }) => (
  <span style={{
    background: (STATUS_COLORS[status] ?? '#6b7280') + '22',
    color: STATUS_COLORS[status] ?? '#6b7280',
    borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 700,
  }}>{status}</span>
)

const RunHistoryPage = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const timetableId = params.get('timetableId') || undefined

  const [page, setPage] = useState(1)
  const pageSize = 20
  const { data, isLoading, isError } = useGenerationRunsQuery({ timetableId, page, pageSize })
  const cancel = useCancelRunMutation()

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="app-content">
      <div className="card-title-row">
        <div>
          <h1 className="card-title" style={{ fontSize: 28, fontWeight: 800 }}>Generation Runs</h1>
          <p className="card-subtitle">
            {timetableId ? 'Runs for the selected timetable.' : 'All generation and optimisation runs.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="pill-button" onClick={() => navigate('/scheduling/optimise')}
            style={{ display: 'flex', gap: 6, alignItems: 'center', ...ghost }}>
            <IconSparkles size={16} /> Optimise
          </button>
          <button type="button" className="pill-button" onClick={() => navigate('/scheduling/launch')}
            style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <IconBolt size={16} /> New run
          </button>
        </div>
      </div>

      {isLoading && <p style={{ padding: 12 }}>Loading…</p>}
      {isError && <p style={{ padding: 12, color: 'crimson' }}>Failed to load runs.</p>}
      {!isLoading && !isError && items.length === 0 && (
        <p style={{ padding: 12, color: 'var(--text-soft, #888)' }}>No runs yet.</p>
      )}

      {items.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={table}>
            <thead>
              <tr>
                {['Algorithm', 'Status', 'Progress', 'Best score', 'Started', 'Finished', ''].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/scheduling/runs/${r.id}`)}>
                  <td style={td}>{r.algorithm}</td>
                  <td style={td}><StatusBadge status={r.status} /></td>
                  <td style={td}>{Math.round(r.progressPercent ?? 0)}%</td>
                  <td style={td}>{r.currentBestScore != null ? r.currentBestScore.toFixed(2) : '—'}</td>
                  <td style={td}>{fmt(r.startedAt)}</td>
                  <td style={td}>{fmt(r.finishedAt)}</td>
                  <td style={td} onClick={(e) => e.stopPropagation()}>
                    {(r.status === 'Running' || r.status === 'Pending') && (
                      <button type="button" style={cancelBtn} disabled={cancel.isPending}
                        onClick={() => cancel.mutate(r.id)}>Cancel</button>
                    )}
                    {r.status === 'Failed' && r.errorMessage && (
                      <span title={r.errorMessage} style={{ color: '#dc2626', fontSize: 12 }}>⚠ error</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
            <button type="button" className="pill-button" style={ghost}
              disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span style={{ fontSize: 13 }}>Page {page} / {totalPages} · {total} run(s)</span>
            <button type="button" className="pill-button" style={ghost}
              disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  )
}

const table = { width: '100%', borderCollapse: 'collapse' }
const th = { textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--border, #ddd)', fontSize: 12 }
const td = { padding: '8px 10px', borderBottom: '1px solid var(--border, #eee)', fontSize: 13 }
const cancelBtn = { background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }
const ghost = { background: 'var(--surface-2, #eee)', color: 'inherit' }

export default RunHistoryPage
