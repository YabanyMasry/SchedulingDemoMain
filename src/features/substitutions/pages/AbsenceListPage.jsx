import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCalendarStats, IconChartBar, IconPlus, IconShieldCheck, IconUserCheck } from '@tabler/icons-react'
import { useTeachersQuery } from '../../resource-management/teachers/api/hooks'
import {
  useAbsencesQuery,
  useRecordAbsenceMutation,
  useConfirmAbsenceMutation,
  useCloseAbsenceMutation,
} from '../api/hooks'
import { ABSENCE_STATUSES, fmtDate } from '../lib/constants'
import StatusBadge from '../components/StatusBadge'
import RecordAbsenceForm from '../components/RecordAbsenceForm'

const apiError = (e) => e?.response?.data?.error ?? e?.message ?? 'Something went wrong.'

// Confirm fans out coverage records; only a Reported absence can be confirmed.
const canConfirm = (s) => s === 'Reported'
// Close is allowed once coverage exists and the absence is not already terminal.
const canClose = (s) => s === 'Confirmed' || s === 'BeingCovered'

const AbsenceListPage = () => {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data, isLoading, isError } = useAbsencesQuery({
    status: statusFilter || undefined,
    page,
    pageSize,
  })
  const { data: teachers } = useTeachersQuery()
  const record = useRecordAbsenceMutation()
  const confirm = useConfirmAbsenceMutation()
  const close = useCloseAbsenceMutation()

  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState(null)
  const [rowError, setRowError] = useState(null)

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // Record then immediately confirm scoped to the picked periods: unselected lessons are excluded
  // from coverage fan-out, so coverage matches the missed periods chosen at record time.
  const handleRecord = (payload) => {
    const { excludedScheduledLessonIds = [], ...body } = payload
    setFormError(null)
    record.mutate(body, {
      onSuccess: (res) => {
        const id = res?.id
        if (!id) { setShowForm(false); return }
        confirm.mutate(
          { id, excludedScheduledLessonIds },
          { onSuccess: () => setShowForm(false), onError: (e) => setFormError(apiError(e)) },
        )
      },
      onError: (e) => setFormError(apiError(e)),
    })
  }

  const handleConfirm = (id) => {
    setRowError(null)
    confirm.mutate({ id }, { onError: (e) => setRowError(apiError(e)) })
  }

  const handleClose = (id) => {
    setRowError(null)
    close.mutate(id, { onError: (e) => setRowError(apiError(e)) })
  }

  return (
    <div className="app-content">
      <div className="card-title-row">
        <div>
          <h1 className="card-title" style={{ fontSize: 28, fontWeight: 800 }}>Absences</h1>
          <p className="card-subtitle">Record teacher absences and trigger coverage.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="pill-button" style={ghost}
            onClick={() => navigate('/substitutions/board')}
            title="Daily cover board">
            <IconCalendarStats size={16} /> Board
          </button>
          <button type="button" className="pill-button" style={ghost}
            onClick={() => navigate('/substitutions/break-duties')}>
            <IconShieldCheck size={16} /> Break duties
          </button>
          <button type="button" className="pill-button" style={ghost}
            onClick={() => navigate('/substitutions/appeals')}>
            <IconUserCheck size={16} /> Appeals
          </button>
          <button type="button" className="pill-button" style={ghost}
            onClick={() => navigate('/substitutions/analytics')}>
            <IconChartBar size={16} /> Analytics
          </button>
          <button type="button" className="pill-button" onClick={() => setShowForm(true)}>
            <IconPlus size={16} /> Record absence
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '8px 0 14px' }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Status</label>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          style={select}>
          <option value="">All</option>
          {ABSENCE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {rowError && <p style={{ color: 'crimson', fontSize: 13, padding: '0 0 8px' }}>{rowError}</p>}
      {isLoading && <p style={{ padding: 12 }}>Loading…</p>}
      {isError && <p style={{ padding: 12, color: 'crimson' }}>Failed to load absences.</p>}
      {!isLoading && !isError && items.length === 0 && (
        <p style={{ padding: 12, color: 'var(--text-soft, #888)' }}>No absences recorded.</p>
      )}

      {items.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={table}>
            <thead>
              <tr>
                {['Teacher', 'Date', 'Type', 'Status', 'Hours', 'Reported', ''].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/substitutions/board?date=${a.date?.slice(0, 10)}`)}>
                  <td style={td}>{a.teacherName || '—'}</td>
                  <td style={td}>{fmtDate(a.date)}</td>
                  <td style={td}>{a.absenceType}</td>
                  <td style={td}><StatusBadge status={a.absenceStatus} /></td>
                  <td style={td}>{a.totalHours}</td>
                  <td style={td}>{fmtDate(a.reportedAt)}</td>
                  <td style={td} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {canConfirm(a.absenceStatus) && (
                        <button type="button" style={primaryBtn} disabled={confirm.isPending}
                          onClick={() => handleConfirm(a.id)}>Confirm</button>
                      )}
                      {canClose(a.absenceStatus) && (
                        <button type="button" style={ghostBtn} disabled={close.isPending}
                          onClick={() => handleClose(a.id)}>Close</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
            <button type="button" className="pill-button" style={ghost}
              disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span style={{ fontSize: 13 }}>Page {page} / {totalPages} · {total} absence(s)</span>
            <button type="button" className="pill-button" style={ghost}
              disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      )}

      {showForm && (
        <RecordAbsenceForm
          teachers={teachers}
          onClose={() => { setShowForm(false); setFormError(null) }}
          onSubmit={handleRecord}
          isSubmitting={record.isPending || confirm.isPending}
          error={formError}
        />
      )}
    </div>
  )
}

const table = { width: '100%', borderCollapse: 'collapse' }
const th = { textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--border, #ddd)', fontSize: 12 }
const td = { padding: '8px 10px', borderBottom: '1px solid var(--border, #eee)', fontSize: 13 }
const select = { padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border, #ccc)', fontSize: 14, background: 'var(--surface, #fff)', color: 'inherit' }
const ghost = { background: 'var(--surface-2, #eee)', color: 'inherit', display: 'flex', gap: 6, alignItems: 'center' }
const primaryBtn = { background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }
const ghostBtn = { background: 'var(--surface-2, #eee)', color: 'inherit', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }

export default AbsenceListPage
