import { useState } from 'react'
import { useMySubstitutionsQuery, useFileAppealMutation, useConfirmAssignmentMutation } from '../api/hooks'
import { fmtDate } from '../lib/constants'
import StatusBadge from '../components/StatusBadge'

const apiError = (e) => e?.response?.data?.error ?? e?.message ?? 'Could not file the appeal.'

// Teacher self-service. Substitution is availability-driven — a teacher cannot accept or reject an
// assignment. Their only lever is an appeal: a reason sent for admin review. The assignment stands
// unless and until the admin upholds the appeal.
const MySubstitutionsPage = () => {
  const { data, isLoading, isError } = useMySubstitutionsQuery()
  const appeal = useFileAppealMutation()
  const confirm = useConfirmAssignmentMutation()

  const [appealFor, setAppealFor] = useState(null) // substitutionId being appealed
  const [reason, setReason] = useState('')
  const [error, setError] = useState(null)

  const items = data ?? []

  const submitAppeal = (e) => {
    e.preventDefault()
    if (!reason.trim()) return
    setError(null)
    appeal.mutate(
      { substitutionId: appealFor, reason: reason.trim() },
      {
        onSuccess: () => { setAppealFor(null); setReason('') },
        onError: (err) => setError(apiError(err)),
      },
    )
  }

  // Appeals are allowed until the assigned period starts. A teacher may appeal again after a prior
  // appeal was rejected (multiple appeals); a pending or upheld appeal blocks a new one.
  const slotInFuture = (s) => !s.lessonStart || new Date(s.lessonStart) > new Date()
  const isTeacherBound = (s) => s.coverageType === 'TeacherSubstitute' || s.coverageType === 'SelfStudy'
  const canAppeal = (s) =>
    isTeacherBound(s) &&
    (s.appealStatus === 'None' || s.appealStatus === 'Rejected') &&
    slotInFuture(s)
  // A teacher may confirm a teacher-bound slot they haven't confirmed yet, before it starts.
  const canConfirm = (s) => isTeacherBound(s) && !s.isConfirmed && slotInFuture(s)

  const submitConfirm = (s) => confirm.mutate(s.substitutionId)

  return (
    <div className="app-content">
      <div className="card-title-row">
        <div>
          <h1 className="card-title" style={{ fontSize: 28, fontWeight: 800 }}>My substitutions</h1>
          <p className="card-subtitle">Lessons you have been assigned to cover.</p>
        </div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-soft, #888)', marginTop: 0 }}>
        You are assigned when you are available — there is no accept/reject. If a slot is a problem,
        file an appeal and an administrator will review it.
      </p>

      {isLoading && <p style={{ padding: 12 }}>Loading…</p>}
      {isError && <p style={{ padding: 12, color: 'crimson' }}>Failed to load your substitutions.</p>}
      {!isLoading && !isError && items.length === 0 && (
        <p style={{ padding: 12, color: 'var(--text-soft, #888)' }}>No substitutions assigned to you.</p>
      )}

      {items.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={table}>
            <thead>
              <tr>{['Date', 'Period', 'Class', 'Subject', 'Room', 'For', 'Confirmed', 'Appeal', ''].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.substitutionId}>
                  <td style={td}>{fmtDate(s.absenceDate)}</td>
                  <td style={td}>{s.periodNumber || '—'}</td>
                  <td style={td}>{s.classNames.join(', ') || '—'}</td>
                  <td style={td}>{s.subjectNames.join(', ') || '—'}</td>
                  <td style={td}>{s.roomNames.join(', ') || '—'}</td>
                  <td style={td}>{s.absentTeacherName || '—'}</td>
                  <td style={td}>
                    {s.isConfirmed
                      ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Confirmed</span>
                      : <span style={{ color: 'var(--text-soft, #888)' }}>—</span>}
                  </td>
                  <td style={td}>
                    {s.appealStatus === 'None'
                      ? <span style={{ color: 'var(--text-soft, #888)' }}>—</span>
                      : <StatusBadge status={s.appealStatus} />}
                    {(s.appealStatus === 'Approved' || s.appealStatus === 'Rejected') && (
                      <div style={notesBox}>
                        <span style={{ fontWeight: 600 }}>Admin response:</span>{' '}
                        {s.appealReviewNotes || <em style={{ color: 'var(--text-soft, #888)' }}>no note left</em>}
                      </div>
                    )}
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {canConfirm(s) && (
                        <button type="button" style={confirmBtn} disabled={confirm.isPending}
                          onClick={() => submitConfirm(s)}>
                          Confirm
                        </button>
                      )}
                      {canAppeal(s) && (
                        <button type="button" style={appealBtn} onClick={() => { setAppealFor(s.substitutionId); setReason(''); setError(null) }}>
                          {s.appealStatus === 'Rejected' ? 'Appeal again' : 'Appeal'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {appealFor && (
        <div style={overlay} onClick={() => setAppealFor(null)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 800 }}>File an appeal</h2>
            <form onSubmit={submitAppeal} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Reason *</span>
                <textarea value={reason} maxLength={1000} rows={4} required
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why this slot doesn't work for you"
                  style={{ ...input, resize: 'vertical' }} />
              </label>
              {error && <p style={{ color: 'crimson', fontSize: 13, margin: 0 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="pill-button" style={ghost} onClick={() => setAppealFor(null)}>Cancel</button>
                <button type="submit" className="pill-button" disabled={!reason.trim() || appeal.isPending}>
                  {appeal.isPending ? 'Submitting…' : 'Submit appeal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const table = { width: '100%', borderCollapse: 'collapse' }
const th = { textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--border, #ddd)', fontSize: 12 }
const td = { padding: '8px 10px', borderBottom: '1px solid var(--border, #eee)', fontSize: 13, verticalAlign: 'top' }
const appealBtn = { background: '#fef3c7', color: '#b45309', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }
const confirmBtn = { background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }
const notesBox = { marginTop: 4, fontSize: 12, color: 'var(--text, #444)', background: 'var(--surface-2, #f3f4f6)', borderRadius: 6, padding: '4px 8px', maxWidth: 260 }
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const modal = { background: 'var(--surface, #fff)', borderRadius: 12, padding: 24, width: 'min(460px, 92vw)', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }
const input = { padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #ccc)', fontSize: 14, background: 'var(--surface, #fff)', color: 'inherit' }
const ghost = { background: 'var(--surface-2, #eee)', color: 'inherit' }

export default MySubstitutionsPage
