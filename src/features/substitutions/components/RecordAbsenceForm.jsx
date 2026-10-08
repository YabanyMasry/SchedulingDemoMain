import { useEffect, useState } from 'react'
import { ABSENCE_TYPES } from '../lib/constants'
import { useTeacherDayLessonsQuery } from '../api/hooks'

// Modal form to record a new teacher absence. The admin picks which of the teacher's lessons that
// day are missed (default: full day = all). Total hours are derived from the selected periods'
// durations — never typed. On submit the page records the absence and confirms it scoped to the
// selected lessons (unselected ones are excluded from coverage fan-out).
const RecordAbsenceForm = ({ teachers, onClose, onSubmit, isSubmitting, error }) => {
  const [teacherId, setTeacherId] = useState('')
  const [date, setDate] = useState('')
  const [absenceType, setAbsenceType] = useState(1)
  const [notes, setNotes] = useState('')
  const [selected, setSelected] = useState(() => new Set()) // scheduledLessonIds missed

  const { data: lessons, isLoading: lessonsLoading } = useTeacherDayLessonsQuery({ teacherId, date })
  const dayLessons = lessons ?? []

  // Default to full day whenever the lesson set changes (teacher/date picked).
  useEffect(() => {
    setSelected(new Set(dayLessons.map((l) => l.scheduledLessonId)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessons])

  const valid = teacherId && date && selected.size > 0
  const allSelected = dayLessons.length > 0 && selected.size === dayLessons.length
  const selectedMinutes = dayLessons
    .filter((l) => selected.has(l.scheduledLessonId))
    .reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0)
  const totalHours = Math.round((selectedMinutes / 60) * 100) / 100

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(dayLessons.map((l) => l.scheduledLessonId)))

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    const excludedScheduledLessonIds = dayLessons
      .map((l) => l.scheduledLessonId)
      .filter((id) => !selected.has(id))
    onSubmit({
      teacherId,
      date,
      startTime: null,
      endTime: null,
      absenceType: Number(absenceType),
      totalHours,
      notes: notes.trim() || null,
      excludedScheduledLessonIds,
    })
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 800 }}>Record absence</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={field}>
            <span style={lbl}>Teacher *</span>
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} style={input} required>
              <option value="">Select teacher…</option>
              {(teachers ?? []).map((t) => (
                <option key={t.id} value={t.id}>{t.displayName ?? `${t.firstName} ${t.lastName ?? ''}`}</option>
              ))}
            </select>
          </label>

          <label style={field}>
            <span style={lbl}>Date *</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={input} required />
          </label>

          <label style={field}>
            <span style={lbl}>Type</span>
            <select value={absenceType} onChange={(e) => setAbsenceType(e.target.value)} style={input}>
              {ABSENCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>

          {/* Period picker — only once a teacher + date are chosen. */}
          {teacherId && date && (
            <div style={field}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={lbl}>Periods missed</span>
                {dayLessons.length > 0 && (
                  <label style={{ fontSize: 12, display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} /> Full day
                  </label>
                )}
              </div>
              {lessonsLoading ? (
                <p style={muted}>Loading lessons…</p>
              ) : dayLessons.length === 0 ? (
                <p style={muted}>No lessons scheduled for this teacher on this day.</p>
              ) : (
                <div style={lessonList}>
                  {dayLessons.map((l) => (
                    <label key={l.scheduledLessonId} style={lessonRow}>
                      <input type="checkbox" checked={selected.has(l.scheduledLessonId)}
                        onChange={() => toggle(l.scheduledLessonId)} />
                      <span style={{ fontWeight: 600, minWidth: 38 }}>P{l.periodNumber}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        {l.subjectNames.join(', ') || 'Lesson'}
                        {l.classNames.length > 0 && <span style={{ color: 'var(--text-soft,#888)' }}> · {l.classNames.join(', ')}</span>}
                      </span>
                      <span style={{ color: 'var(--text-soft,#888)', fontSize: 12 }}>{l.durationMinutes}m</span>
                    </label>
                  ))}
                </div>
              )}
              {dayLessons.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-soft,#666)', marginTop: 4 }}>
                  Total hours missed (derived): <strong>{totalHours}</strong> · {selected.size}/{dayLessons.length} periods
                </div>
              )}
            </div>
          )}

          <label style={field}>
            <span style={lbl}>Notes</span>
            <textarea value={notes} maxLength={1000} rows={3}
              onChange={(e) => setNotes(e.target.value)} style={{ ...input, resize: 'vertical' }} />
          </label>

          {error && <p style={{ color: 'crimson', fontSize: 13, margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="pill-button" style={ghost} onClick={onClose}>Cancel</button>
            <button type="submit" className="pill-button" disabled={!valid || isSubmitting}>
              {isSubmitting ? 'Recording…' : 'Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const modal = { background: 'var(--surface, #fff)', borderRadius: 12, padding: 24, width: 'min(460px, 92vw)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }
const field = { display: 'flex', flexDirection: 'column', gap: 4 }
const lbl = { fontSize: 13, fontWeight: 600 }
const input = { padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #ccc)', fontSize: 14, background: 'var(--surface, #fff)', color: 'inherit' }
const ghost = { background: 'var(--surface-2, #eee)', color: 'inherit' }
const muted = { fontSize: 13, color: 'var(--text-soft, #888)', margin: '4px 0' }
const lessonList = { display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid var(--border, #eee)', borderRadius: 8, padding: 6, maxHeight: 180, overflowY: 'auto' }
const lessonRow = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, padding: '3px 4px', cursor: 'pointer' }

export default RecordAbsenceForm
