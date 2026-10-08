import { useState } from 'react'

// Create or edit a break-supervision duty. On create the room / day / period are fixed by the
// grid cell that was clicked (passed in `initial`); on edit only teacher / points / notes change
// (the cell coordinates are immutable — matching the backend UpdateBreakDutyCommand).
const BreakDutyForm = ({ mode, initial, teachers, onClose, onSubmit, isSubmitting, error, onDeactivate, isDeactivating }) => {
  const [teacherId, setTeacherId] = useState(initial?.teacherId ?? '')
  const [points, setPoints] = useState(initial?.points ?? 0)
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const submit = (e) => {
    e.preventDefault()
    if (mode === 'create') {
      onSubmit({
        roomId: initial.roomId,
        teacherId: teacherId || null,
        timetableId: null,
        dayOfWeek: initial.dayOfWeek,
        periodNumber: initial.periodNumber,
        points: Number(points) || 0,
        notes: notes.trim() || null,
      })
    } else {
      onSubmit({
        id: initial.id,
        teacherId: teacherId || null,
        points: Number(points) || 0,
        notes: notes.trim() || null,
      })
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800 }}>
          {mode === 'create' ? 'Add duty' : 'Edit duty'}
        </h2>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-soft, #888)' }}>
          {initial?.roomName ?? 'Room'} · {initial.dayOfWeek} · period {initial.periodNumber}
        </p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={field}>
            <span style={lbl}>Supervisor</span>
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} style={input}>
              <option value="">Unassigned</option>
              {(teachers ?? []).map((t) => (
                <option key={t.id} value={t.id}>{t.displayName ?? `${t.firstName} ${t.lastName ?? ''}`}</option>
              ))}
            </select>
          </label>

          <label style={field}>
            <span style={lbl}>Points</span>
            <input type="number" min="0" max="100" value={points}
              onChange={(e) => setPoints(e.target.value)} style={input} />
          </label>

          <label style={field}>
            <span style={lbl}>Notes</span>
            <textarea value={notes} maxLength={500} rows={2}
              onChange={(e) => setNotes(e.target.value)} style={{ ...input, resize: 'vertical' }} />
          </label>

          {error && <p style={{ color: 'crimson', fontSize: 13, margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            {onDeactivate ? (
              <button type="button" style={deactivateBtn} disabled={isDeactivating} onClick={onDeactivate}>
                {isDeactivating ? 'Deactivating…' : 'Deactivate'}
              </button>
            ) : <span />}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="pill-button" style={ghost} onClick={onClose}>Cancel</button>
              <button type="submit" className="pill-button" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const modal = { background: 'var(--surface, #fff)', borderRadius: 12, padding: 24, width: 'min(440px, 92vw)', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }
const field = { display: 'flex', flexDirection: 'column', gap: 4 }
const lbl = { fontSize: 13, fontWeight: 600 }
const input = { padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #ccc)', fontSize: 14, background: 'var(--surface, #fff)', color: 'inherit' }
const ghost = { background: 'var(--surface-2, #eee)', color: 'inherit' }
const deactivateBtn = { background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }

export default BreakDutyForm
