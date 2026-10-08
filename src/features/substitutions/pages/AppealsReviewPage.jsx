import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowLeft } from '@tabler/icons-react'
import { useAppealsQuery, useReviewAppealMutation } from '../api/hooks'
import { fmtDate } from '../lib/constants'

const apiError = (e) => e?.response?.data?.error ?? e?.message ?? 'Review failed.'

// Admin appeal review queue. Approving an appeal unassigns the substitute and reverts the slot to
// pending, so it reappears on the board for reassignment; rejecting leaves the assignment standing.
const AppealsReviewPage = () => {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useAppealsQuery()
  const review = useReviewAppealMutation()

  const [notesFor, setNotesFor] = useState(null)
  const [notes, setNotes] = useState('')
  const [rowError, setRowError] = useState(null)

  const items = data ?? []

  const decide = (substitutionId, approved) => {
    setRowError(null)
    review.mutate(
      { substitutionId, approved, notes: notesFor === substitutionId ? notes.trim() || null : null },
      {
        onSuccess: () => { setNotesFor(null); setNotes('') },
        onError: (e) => setRowError({ id: substitutionId, message: apiError(e) }),
      },
    )
  }

  return (
    <div className="app-content">
      <div className="card-title-row">
        <div>
          <h1 className="card-title" style={{ fontSize: 28, fontWeight: 800 }}>Substitution appeals</h1>
          <p className="card-subtitle">Pending teacher appeals awaiting review.</p>
        </div>
        <button type="button" className="pill-button" style={ghost} onClick={() => navigate('/substitutions')}>
          <IconArrowLeft size={16} /> Absences
        </button>
      </div>

      {isLoading && <p style={{ padding: 12 }}>Loading…</p>}
      {isError && <p style={{ padding: 12, color: 'crimson' }}>Failed to load appeals.</p>}
      {!isLoading && !isError && items.length === 0 && (
        <p style={{ padding: 12, color: 'var(--text-soft, #888)' }}>No pending appeals.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((a) => (
          <div key={a.substitutionId} style={panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 14 }}>
                <strong>{a.substituteTeacherName || '—'}</strong> appealed —{' '}
                {a.subjectNames.join(', ') || 'lesson'} · {a.classNames.join(', ') || '—'} ·{' '}
                room {a.roomNames.join(', ') || '—'} · period {a.periodNumber || '—'}
                <div style={{ fontSize: 12, color: 'var(--text-soft, #888)' }}>
                  {fmtDate(a.absenceDate)} · covering {a.absentTeacherName || '—'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <button type="button" style={approveBtn} disabled={review.isPending}
                  onClick={() => decide(a.substitutionId, true)}>Approve (unassign)</button>
                <button type="button" style={rejectBtn} disabled={review.isPending}
                  onClick={() => decide(a.substitutionId, false)}>Reject</button>
              </div>
            </div>

            <div style={{ marginTop: 8, fontSize: 13, background: 'var(--surface-2, #f3f4f6)', padding: '8px 12px', borderRadius: 8 }}>
              “{a.appealReason || '—'}”
            </div>

            <div style={{ marginTop: 8 }}>
              {notesFor === a.substitutionId ? (
                <textarea value={notes} maxLength={1000} rows={2} placeholder="Review notes (optional)"
                  onChange={(e) => setNotes(e.target.value)} style={{ ...input, width: '100%', resize: 'vertical' }} />
              ) : (
                <button type="button" style={linkBtn} onClick={() => { setNotesFor(a.substitutionId); setNotes('') }}>
                  + Add review note
                </button>
              )}
            </div>

            {rowError?.id === a.substitutionId && (
              <p style={{ color: 'crimson', fontSize: 12, marginTop: 6 }}>{rowError.message}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const panel = { border: '1px solid var(--border, #e5e5e5)', borderRadius: 12, padding: 16, background: 'var(--surface, #fff)' }
const ghost = { background: 'var(--surface-2, #eee)', color: 'inherit', display: 'flex', gap: 6, alignItems: 'center' }
const approveBtn = { background: '#dcfce7', color: '#15803d', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }
const rejectBtn = { background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }
const linkBtn = { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0 }
const input = { padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #ccc)', fontSize: 14, background: 'var(--surface, #fff)', color: 'inherit' }

export default AppealsReviewPage
