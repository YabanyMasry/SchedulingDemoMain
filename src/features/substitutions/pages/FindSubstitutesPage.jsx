import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { IconArrowLeft, IconBolt } from '@tabler/icons-react'
import { useCandidatesQuery, useAssignSubstituteMutation } from '../api/hooks'
import { SUBSTITUTION_TYPES, canForceAssign, fmtDate } from '../lib/constants'
import StatusBadge from '../components/StatusBadge'

const apiError = (e) => e?.response?.data?.error ?? e?.message ?? 'Assignment failed.'
const apiCodes = (e) => e?.response?.data?.code ?? null

// Candidate finder + assignment for an absence. Entered from the daily board, which passes the
// absence context (affected lessons + the lesson to start on) through router *state* — the internal
// scheduled-lesson id is deliberately kept out of the URL. The page shows every lesson the absence
// affects, lets the admin pick one, then lists the free/available qualified teachers for that slot.
const FindSubstitutesPage = () => {
  const navigate = useNavigate()
  const { state } = useLocation()

  const lessons = state?.lessons ?? []
  const [lessonId, setLessonId] = useState(state?.selectedLessonId ?? '')

  const { data, isLoading, isError } = useCandidatesQuery(lessonId)
  const assign = useAssignSubstituteMutation()

  // Per-row UX state: which candidate is mid-assign, and the last failure to show inline.
  const [activeTeacher, setActiveTeacher] = useState(null)
  const [rowError, setRowError] = useState(null)
  const [okMessage, setOkMessage] = useState(null)

  const substitutionId = data?.substitutionId
  const candidates = data?.candidates ?? []
  // Lock every assign/disposition action while a request is in flight or once one has succeeded —
  // the candidate list is briefly stale after assignment and a second click would 409.
  const assignLocked = assign.isPending || Boolean(okMessage)

  const runAssign = (body, teacherKey) => {
    setRowError(null)
    setOkMessage(null)
    setActiveTeacher(teacherKey)
    assign.mutate(
      { substitutionId, ...body },
      {
        onSuccess: () => { setOkMessage('Assigned.'); setActiveTeacher(null) },
        onError: (e) => {
          const codes = apiCodes(e)
          setRowError({ key: teacherKey, message: apiError(e) + (codes ? ` (${codes})` : '') })
          setActiveTeacher(null)
        },
      },
    )
  }

  const assignTeacher = (c, force = false) =>
    runAssign(
      {
        type: 1, // TeacherSubstitute
        substituteTeacherId: c.teacherId,
        hoursWorked: 0,
        payRate: null,
        notes: null,
        ignoredCodes: force ? c.violatingHardCodes : [],
      },
      c.teacherId,
    )

  const assignDisposition = (typeValue) =>
    runAssign(
      { type: typeValue, substituteTeacherId: null, hoursWorked: 0, payRate: null, notes: null, ignoredCodes: [] },
      `disp-${typeValue}`,
    )

  const selectLesson = (id) => {
    if (id === lessonId) return
    setLessonId(id)
    setRowError(null)
    setOkMessage(null)
  }

  return (
    <div className="app-content">
      <div className="card-title-row">
        <div>
          <h1 className="card-title" style={{ fontSize: 28, fontWeight: 800 }}>Find substitutes</h1>
          <p className="card-subtitle">Pick an affected lesson, then assign a free, available teacher.</p>
        </div>
        <button type="button" className="pill-button" style={ghost} onClick={() => navigate(-1)}>
          <IconArrowLeft size={16} /> Back
        </button>
      </div>

      {/* No lesson context — the page is only reachable from the daily board (the scheduled-lesson
          id is intentionally not in the URL, so a refresh loses it). */}
      {lessons.length === 0 && !lessonId && (
        <p style={{ padding: 12, color: 'var(--text-soft, #888)' }}>
          Open this page from the daily cover board — pick an absence's lesson to find substitutes.
        </p>
      )}

      {/* Affected lessons for the absence — the admin sees the whole picture before assigning. */}
      {lessons.length > 0 && (
        <div style={panel}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
            Lessons affected by {state?.teacherName || 'this absence'}{state?.absenceType ? ` · ${state.absenceType}` : ''}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={table}>
              <thead>
                <tr>{['', 'Period', 'Class', 'Subject', 'Room', 'Coverage', 'Substitute'].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {lessons.map((l) => {
                  const active = l.scheduledLessonId === lessonId
                  return (
                    <tr key={l.substitutionId} onClick={() => selectLesson(l.scheduledLessonId)}
                      style={{ cursor: 'pointer', background: active ? '#eff6ff' : 'transparent' }}>
                      <td style={td}>
                        <input type="radio" readOnly checked={active} />
                      </td>
                      <td style={td}>{l.periodNumber || '—'}</td>
                      <td style={td}>{l.classNames?.join(', ') || '—'}</td>
                      <td style={td}>{l.subjectNames?.join(', ') || '—'}</td>
                      <td style={td}>{l.roomNames?.join(', ') || '—'}</td>
                      <td style={td}><StatusBadge status={l.coverageStatus} /></td>
                      <td style={td}>{l.substituteTeacherName || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lessonId && isLoading && <p style={{ padding: 12 }}>Loading candidates…</p>}
      {lessonId && isError && <p style={{ padding: 12, color: 'crimson' }}>No active substitution for that lesson.</p>}

      {data && (
        <>
          <div style={contextBar}>
            <div><strong>Absent:</strong> {data.absentTeacherName}</div>
            <div><strong>Date:</strong> {fmtDate(data.absenceDate)} ({data.dayOfWeek})</div>
            <div><strong>Period:</strong> {data.periodNumber}</div>
          </div>

          {okMessage && <p style={{ color: '#16a34a', fontSize: 13, fontWeight: 600 }}>{okMessage}</p>}

          {candidates.length === 0 ? (
            <p style={{ padding: 12, color: 'var(--text-soft, #888)' }}>No qualified candidates.</p>
          ) : (
            <>
              {/* Scrollable so a long candidate list never hides rows below the fold. */}
              <div style={tableScroll}>
                <table style={table}>
                  <thead>
                    <tr>{['Teacher', 'Available', 'Periods today', 'Sub load', 'Reason', ''].map((h) => (
                      <th key={h} style={thSticky}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {candidates.map((c) => {
                      const force = !c.isFeasible && canForceAssign(c.violatingHardCodes)
                      const busy = activeTeacher === c.teacherId && assign.isPending
                      return (
                        <tr key={c.teacherId}>
                          <td style={td}>{c.teacherName || '—'}</td>
                          <td style={td}>
                            {c.isFeasible
                              ? <span style={{ color: '#16a34a', fontWeight: 700 }}>Free</span>
                              : <span style={{ color: '#dc2626', fontWeight: 700 }}>Busy</span>}
                          </td>
                          <td style={td}>{c.periodsAlreadyThatDay}</td>
                          <td style={td}>{c.assignedSubstitutionLoad}</td>
                          <td style={{ ...td, maxWidth: 280 }}>
                            {c.isFeasible ? '—' : (
                              <span title={c.violationMessages?.join('\n')} style={{ fontSize: 12 }}>
                                {c.violatingHardCodes.join(', ')}
                              </span>
                            )}
                            {rowError?.key === c.teacherId && (
                              <div style={{ color: 'crimson', fontSize: 12, marginTop: 4 }}>{rowError.message}</div>
                            )}
                          </td>
                          <td style={td}>
                            {c.isFeasible && (
                              <button type="button" style={primaryBtn} disabled={assignLocked || !substitutionId}
                                onClick={() => assignTeacher(c, false)}>
                                {busy ? 'Assigning…' : 'Assign'}
                              </button>
                            )}
                            {force && (
                              <button type="button" style={forceBtn} disabled={assignLocked || !substitutionId}
                                onClick={() => assignTeacher(c, true)} title="Override capacity limits">
                                <IconBolt size={13} /> Force
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Teacher-less dispositions when nobody can cover cleanly. */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-soft, #888)', marginBottom: 6 }}>
                  Or resolve without a substitute
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SUBSTITUTION_TYPES.filter((t) => !t.needsTeacher).map((t) => (
                    <button key={t.value} type="button" style={ghostBtn} disabled={!substitutionId || assignLocked}
                      onClick={() => assignDisposition(t.value)}>{t.label}</button>
                  ))}
                </div>
                {rowError?.key?.toString().startsWith('disp-') && (
                  <div style={{ color: 'crimson', fontSize: 12, marginTop: 6 }}>{rowError.message}</div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

const panel = { border: '1px solid var(--border, #e5e5e5)', borderRadius: 12, padding: 16, background: 'var(--surface, #fff)' }
const table = { width: '100%', borderCollapse: 'collapse' }
const tableScroll = { maxHeight: '55vh', overflowY: 'auto', overflowX: 'auto', border: '1px solid var(--border, #eee)', borderRadius: 10 }
const th = { textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--border, #ddd)', fontSize: 12 }
const thSticky = { ...th, position: 'sticky', top: 0, background: 'var(--surface, #fff)', zIndex: 1 }
const td = { padding: '8px 10px', borderBottom: '1px solid var(--border, #eee)', fontSize: 13, verticalAlign: 'top' }
const contextBar = { display: 'flex', gap: 24, flexWrap: 'wrap', padding: '10px 14px', borderRadius: 10, background: 'var(--surface-2, #f3f4f6)', fontSize: 13 }
const ghost = { background: 'var(--surface-2, #eee)', color: 'inherit', display: 'flex', gap: 6, alignItems: 'center' }
const primaryBtn = { background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, marginRight: 6 }
const forceBtn = { background: '#fef3c7', color: '#b45309', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'inline-flex', gap: 4, alignItems: 'center' }
const ghostBtn = { background: 'var(--surface-2, #eee)', color: 'inherit', border: '1px solid var(--border, #ddd)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }

export default FindSubstitutesPage
