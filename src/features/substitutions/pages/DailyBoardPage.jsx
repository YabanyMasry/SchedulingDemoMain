import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IconArrowLeft, IconSearch } from '@tabler/icons-react'
import {
  useDailyBoardQuery,
  useAssignBreakSubstituteMutation,
  useAssignBreakDispositionMutation,
} from '../api/hooks'
import { useTeachersQuery } from '../../resource-management/teachers/api/hooks'
import { toIsoDate, fmtDate } from '../lib/constants'
import StatusBadge from '../components/StatusBadge'
import BreakCoverModal from '../components/BreakCoverModal'

const apiError = (e) => e?.response?.data?.error ?? e?.message ?? 'Failed.'

// The cover monitor for one day. Pick a date → every absence on it, each affected lesson with
// its coverage status + substitute, and break duties needing cover. Pending lesson rows expose
// a "find/assign" entry point that carries both the scheduled-lesson id (to load candidates) and
// the substitution id (to assign) into the FindSubstitutes flow.
const DailyBoardPage = () => {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const initial = params.get('date') || toIsoDate(new Date())
  const [date, setDate] = useState(initial)

  const { data, isLoading, isError } = useDailyBoardQuery(date)
  const { data: teachers } = useTeachersQuery()
  const assignBreak = useAssignBreakSubstituteMutation()
  const disposeBreak = useAssignBreakDispositionMutation()

  const [coverRow, setCoverRow] = useState(null)
  const [coverError, setCoverError] = useState(null)

  const onDateChange = (value) => {
    setDate(value)
    setParams(value ? { date: value } : {})
  }

  const absences = data?.absences ?? []

  const submitAssign = (body) => {
    setCoverError(null)
    assignBreak.mutate(
      { breakSubstitutionId: coverRow.breakSubstitutionId, ...body },
      { onSuccess: () => setCoverRow(null), onError: (e) => setCoverError(apiError(e)) },
    )
  }
  const submitDispose = (body) => {
    setCoverError(null)
    disposeBreak.mutate(
      { breakSubstitutionId: coverRow.breakSubstitutionId, ...body },
      { onSuccess: () => setCoverRow(null), onError: (e) => setCoverError(apiError(e)) },
    )
  }

  // Carry the absence context through router state (not the URL) so the internal scheduled-lesson
  // id is never exposed in a shareable/loggable link. The find page renders the affected-lesson
  // list from `lessons` and loads candidates for `selectedLessonId`.
  const goFind = (absence, row) =>
    navigate('/substitutions/find', {
      state: {
        teacherName: absence.teacherName,
        absenceType: absence.absenceType,
        lessons: absence.lessons,
        selectedLessonId: row.scheduledLessonId,
      },
    })

  return (
    <div className="app-content">
      <div className="card-title-row">
        <div>
          <h1 className="card-title" style={{ fontSize: 28, fontWeight: 800 }}>Daily cover board</h1>
          <p className="card-subtitle">All absences and coverage for a single day.</p>
        </div>
        <button type="button" className="pill-button" style={ghost}
          onClick={() => navigate('/substitutions')}>
          <IconArrowLeft size={16} /> Absences
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '8px 0 16px' }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Date</label>
        <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} style={input} />
        {data && (
          <span style={{ fontSize: 13, color: 'var(--text-soft, #888)' }}>
            {data.totalCoverageRecords} record(s) · {data.pendingCount} pending
          </span>
        )}
      </div>

      {isLoading && <p style={{ padding: 12 }}>Loading…</p>}
      {isError && <p style={{ padding: 12, color: 'crimson' }}>Failed to load the board.</p>}
      {!isLoading && !isError && absences.length === 0 && (
        <p style={{ padding: 12, color: 'var(--text-soft, #888)' }}>No absences on {fmtDate(date)}.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {absences.map((a) => (
          <div key={a.absenceId} style={panel}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <strong style={{ fontSize: 16 }}>{a.teacherName || '—'}</strong>
              <span style={{ fontSize: 13, color: 'var(--text-soft, #888)' }}>{a.absenceType}</span>
              <StatusBadge status={a.absenceStatus} />
            </div>

            {a.lessons.length > 0 && (
              <table style={table}>
                <thead>
                  <tr>{['Period', 'Class', 'Subject', 'Room', 'Coverage', 'Substitute', ''].map((h) => (
                    <th key={h} style={th}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {a.lessons.map((l) => (
                    <tr key={l.substitutionId}>
                      <td style={td}>{l.periodNumber || '—'}</td>
                      <td style={td}>{l.classNames.join(', ') || '—'}</td>
                      <td style={td}>{l.subjectNames.join(', ') || '—'}</td>
                      <td style={td}>{l.roomNames.join(', ') || '—'}</td>
                      <td style={td}><StatusBadge status={l.coverageStatus} /></td>
                      <td style={td}>
                        {l.substituteTeacherName || '—'}
                        {l.substituteConfirmed && (
                          <span title="Teacher confirmed" style={{ color: '#16a34a', fontSize: 11, fontWeight: 700 }}> ✓ confirmed</span>
                        )}
                        {l.appealStatus === 'Requested' && (
                          <span title="Appeal under review" style={{ color: '#b45309', fontSize: 11, fontWeight: 700 }}> ⚑ appeal</span>
                        )}
                      </td>
                      <td style={td}>
                        <button type="button" style={findBtn} onClick={() => goFind(a, l)}>
                          <IconSearch size={13} /> {l.coverageStatus === 'PendingAssignment' ? 'Assign' : 'Reassign'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {a.breakDuties.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-soft, #888)', marginBottom: 4 }}>
                  Break duties
                </div>
                <table style={table}>
                  <thead>
                    <tr>{['Period', 'Room', 'Coverage', 'Substitute', ''].map((h) => (
                      <th key={h} style={th}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {a.breakDuties.map((b) => (
                      <tr key={b.breakSubstitutionId}>
                        <td style={td}>{b.periodNumber || '—'}</td>
                        <td style={td}>{b.roomName || '—'}</td>
                        <td style={td}><StatusBadge status={b.coverageStatus} /></td>
                        <td style={td}>{b.substituteTeacherName || '—'}</td>
                        <td style={td}>
                          <button type="button" style={findBtn}
                            onClick={() => { setCoverRow(b); setCoverError(null) }}>
                            {b.coverageStatus === 'PendingAssignment' ? 'Cover' : 'Change'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {a.lessons.length === 0 && a.breakDuties.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-soft, #888)', margin: 0 }}>
                No coverage records (confirm the absence to fan out lessons).
              </p>
            )}
          </div>
        ))}
      </div>

      {coverRow && (
        <BreakCoverModal
          row={coverRow}
          teachers={teachers}
          onAssign={submitAssign}
          onDispose={submitDispose}
          onClose={() => setCoverRow(null)}
          busy={assignBreak.isPending || disposeBreak.isPending}
          error={coverError}
        />
      )}
    </div>
  )
}

const panel = { border: '1px solid var(--border, #e5e5e5)', borderRadius: 12, padding: 16, background: 'var(--surface, #fff)' }
const table = { width: '100%', borderCollapse: 'collapse' }
const th = { textAlign: 'left', padding: '6px 10px', borderBottom: '2px solid var(--border, #ddd)', fontSize: 12 }
const td = { padding: '6px 10px', borderBottom: '1px solid var(--border, #eee)', fontSize: 13 }
const input = { padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border, #ccc)', fontSize: 14, background: 'var(--surface, #fff)', color: 'inherit' }
const ghost = { background: 'var(--surface-2, #eee)', color: 'inherit', display: 'flex', gap: 6, alignItems: 'center' }
const findBtn = { background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'inline-flex', gap: 4, alignItems: 'center' }

export default DailyBoardPage
