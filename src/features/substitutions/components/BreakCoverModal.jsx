import { useState } from 'react'
import { SUPERVISION_DISPOSITIONS } from '../lib/constants'

// Assigns cover for a break-supervision duty whose supervisor is absent. Either name a substitute
// supervisor or record a teacher-less disposition (Cancelled / Combined Area). Duties don't go
// through the lesson HC engine — the backend only blocks a double-booked substitute.
const BreakCoverModal = ({ row, teachers, onAssign, onDispose, onClose, busy, error }) => {
  const [teacherId, setTeacherId] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800 }}>Cover break duty</h2>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-soft, #888)' }}>
          {row.roomName || 'Room'} · period {row.periodNumber || '—'}
        </p>

        <label style={field}>
          <span style={lbl}>Substitute supervisor</span>
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} style={input}>
            <option value="">Select teacher…</option>
            {(teachers ?? []).map((t) => (
              <option key={t.id} value={t.id}>{t.displayName ?? `${t.firstName} ${t.lastName ?? ''}`}</option>
            ))}
          </select>
        </label>

        <label style={field}>
          <span style={lbl}>Notes</span>
          <textarea value={notes} maxLength={500} rows={2}
            onChange={(e) => setNotes(e.target.value)} style={{ ...input, resize: 'vertical' }} />
        </label>

        {error && <p style={{ color: 'crimson', fontSize: 13, margin: '4px 0' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="pill-button" style={ghost} onClick={onClose}>Cancel</button>
          <button type="button" className="pill-button" disabled={!teacherId || busy}
            onClick={() => onAssign({ substituteTeacherId: teacherId, notes: notes.trim() || null })}>
            {busy ? 'Saving…' : 'Assign'}
          </button>
        </div>

        <div style={{ marginTop: 14, borderTop: '1px solid var(--border, #eee)', paddingTop: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-soft, #888)', marginBottom: 6 }}>
            Or resolve without a substitute
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {SUPERVISION_DISPOSITIONS.map((d) => (
              <button key={d.value} type="button" style={dispBtn} disabled={busy}
                onClick={() => onDispose({ type: d.value, notes: notes.trim() || null })}>{d.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const modal = { background: 'var(--surface, #fff)', borderRadius: 12, padding: 24, width: 'min(440px, 92vw)', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }
const field = { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }
const lbl = { fontSize: 13, fontWeight: 600 }
const input = { padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #ccc)', fontSize: 14, background: 'var(--surface, #fff)', color: 'inherit' }
const ghost = { background: 'var(--surface-2, #eee)', color: 'inherit' }
const dispBtn = { background: 'var(--surface-2, #eee)', color: 'inherit', border: '1px solid var(--border, #ddd)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }

export default BreakCoverModal
