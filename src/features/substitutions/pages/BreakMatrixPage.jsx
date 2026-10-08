import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowLeft } from '@tabler/icons-react'
import { useRoomsQuery } from '../../resource-management/rooms/api/hooks'
import { usePeriodsQuery } from '../../resource-management/periods/api/hooks'
import { useTeachersQuery } from '../../resource-management/teachers/api/hooks'
import {
  useBreakDutiesQuery,
  useCreateBreakDutyMutation,
  useUpdateBreakDutyMutation,
  useDeactivateBreakDutyMutation,
} from '../api/hooks'
import { SCHOOL_DAYS } from '../lib/constants'
import BreakDutyForm from '../components/BreakDutyForm'

const apiError = (e) => e?.response?.data?.error ?? e?.message ?? 'Something went wrong.'

// The break-supervision duty matrix: a room × period × day grid. A room is picked at the top; its
// active duties fill a period (rows) × day (columns) grid. Empty cells create a duty; filled cells
// edit or deactivate. Recurring duties only — per-date cover is handled on the daily board.
const BreakMatrixPage = () => {
  const navigate = useNavigate()
  const { data: rooms } = useRoomsQuery()
  const { data: periods } = usePeriodsQuery()
  const { data: teachers } = useTeachersQuery()
  const { data: duties, isLoading, isError } = useBreakDutiesQuery()

  const create = useCreateBreakDutyMutation()
  const update = useUpdateBreakDutyMutation()
  const deactivate = useDeactivateBreakDutyMutation()

  const [roomId, setRoomId] = useState('')
  const [modal, setModal] = useState(null) // { mode, initial }
  const [formError, setFormError] = useState(null)
  const [rowError, setRowError] = useState(null)

  const roomList = useMemo(() => rooms ?? [], [rooms])
  const periodNumbers = useMemo(
    () => [...new Set((periods ?? []).map((p) => p.periodNumber))].sort((a, b) => a - b),
    [periods],
  )

  const roomName = useMemo(() => {
    const r = roomList.find((x) => x.id === roomId)
    return r?.name ?? r?.roomNumber ?? 'Room'
  }, [roomList, roomId])

  // (day, periodNumber) → active duty for the selected room.
  const dutyByCell = useMemo(() => {
    const map = {}
    for (const d of duties ?? []) {
      if (d.roomId !== roomId || !d.isActive) continue
      map[`${d.dayOfWeek}|${d.periodNumber}`] = d
    }
    return map
  }, [duties, roomId])

  const openCell = (day, periodNumber) => {
    setFormError(null)
    const existing = dutyByCell[`${day}|${periodNumber}`]
    if (existing) {
      setModal({ mode: 'edit', initial: { ...existing, roomName } })
    } else {
      setModal({ mode: 'create', initial: { roomId, roomName, dayOfWeek: day, periodNumber } })
    }
  }

  const handleSubmit = (payload) => {
    setFormError(null)
    const onError = (e) => setFormError(apiError(e))
    const onSuccess = () => setModal(null)
    if (modal.mode === 'create') create.mutate(payload, { onSuccess, onError })
    else update.mutate(payload, { onSuccess, onError })
  }

  const handleDeactivate = (id) => {
    setRowError(null)
    deactivate.mutate(id, { onSuccess: () => setModal(null), onError: (e) => setRowError(apiError(e)) })
  }

  return (
    <div className="app-content">
      <div className="card-title-row">
        <div>
          <h1 className="card-title" style={{ fontSize: 28, fontWeight: 800 }}>Break supervision</h1>
          <p className="card-subtitle">Who supervises which room each break period.</p>
        </div>
        <button type="button" className="pill-button" style={ghost} onClick={() => navigate('/substitutions')}>
          <IconArrowLeft size={16} /> Absences
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '8px 0 16px' }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Room</label>
        <select value={roomId} onChange={(e) => setRoomId(e.target.value)} style={select}>
          <option value="">Select room…</option>
          {roomList.map((r) => (
            <option key={r.id} value={r.id}>{r.name ?? r.roomNumber}</option>
          ))}
        </select>
      </div>

      {rowError && <p style={{ color: 'crimson', fontSize: 13 }}>{rowError}</p>}
      {isLoading && <p style={{ padding: 12 }}>Loading…</p>}
      {isError && <p style={{ padding: 12, color: 'crimson' }}>Failed to load duties.</p>}

      {!roomId && (
        <p style={{ padding: 12, color: 'var(--text-soft, #888)' }}>Pick a room to view its duty matrix.</p>
      )}

      {roomId && periodNumbers.length === 0 && (
        <p style={{ padding: 12, color: 'var(--text-soft, #888)' }}>No periods defined.</p>
      )}

      {roomId && periodNumbers.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Period</th>
                {SCHOOL_DAYS.map((d) => <th key={d} style={th}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {periodNumbers.map((pn) => (
                <tr key={pn}>
                  <td style={{ ...td, fontWeight: 700 }}>{pn}</td>
                  {SCHOOL_DAYS.map((day) => {
                    const duty = dutyByCell[`${day}|${pn}`]
                    return (
                      <td key={day} style={td}>
                        <button type="button" style={duty ? filledCell : emptyCell}
                          onClick={() => openCell(day, pn)}
                          title={duty ? 'Edit duty' : 'Add duty'}>
                          {duty
                            ? (duty.teacherName || 'Unassigned')
                            : <span style={{ opacity: 0.5 }}>+</span>}
                          {duty && duty.points > 0 && (
                            <span style={pts}>{duty.points}pt</span>
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <BreakDutyForm
          mode={modal.mode}
          initial={modal.initial}
          teachers={teachers}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          isSubmitting={create.isPending || update.isPending}
          error={formError}
          onDeactivate={modal.mode === 'edit' ? () => handleDeactivate(modal.initial.id) : undefined}
          isDeactivating={deactivate.isPending}
        />
      )}
    </div>
  )
}

const table = { borderCollapse: 'collapse', minWidth: 640 }
const th = { textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--border, #ddd)', fontSize: 12, minWidth: 120 }
const td = { padding: 6, borderBottom: '1px solid var(--border, #eee)', fontSize: 13, verticalAlign: 'top' }
const select = { padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border, #ccc)', fontSize: 14, background: 'var(--surface, #fff)', color: 'inherit' }
const ghost = { background: 'var(--surface-2, #eee)', color: 'inherit', display: 'flex', gap: 6, alignItems: 'center' }
const cellBase = { width: '100%', textAlign: 'left', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }
const filledCell = { ...cellBase, background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' }
const emptyCell = { ...cellBase, background: 'var(--surface-2, #f3f4f6)', color: 'inherit', border: '1px dashed var(--border, #ccc)', justifyContent: 'center' }
const pts = { fontSize: 11, fontWeight: 700, opacity: 0.7 }

export default BreakMatrixPage
