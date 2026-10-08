import { useState } from 'react'
import EntityFormModal from '../../components/common/EntityFormModal'
import { ROOM_TYPES } from '../../common/roomTypes'

const LessonForm = ({
  mode,
  initial,
  onClose,
  onSubmit,
  isSubmitting,
  teachers,
  classes,
  subjects,
}) => {
  const [form, setForm] = useState({
    duration: initial?.duration ?? 1,
    frequencyPerWeek: initial?.frequencyPerWeek ?? 1,
    requiredRoomType: initial?.requiredRoomType ?? '',
    priority: initial?.priority ?? '',
    numberOfStudents: initial?.numberOfStudents ?? '',
    studentGroup: initial?.studentGroup ?? '',
    homeRoom: initial?.homeRoom ?? '',
    specialRequirements: initial?.specialRequirements ?? '',
    teacherIds: new Set(initial?.teacherIds ?? []),
    classIds: new Set(initial?.classIds ?? []),
    subjectIds: new Set(initial?.subjectIds ?? []),
    leadTeacherId: initial?.leadTeacherId ?? '',
    // Teacher→subject pairings stored as a Set of `${teacherId}|${subjectId}` keys.
    assignments: new Set((initial?.assignments ?? []).map((a) => `${a.teacherId}|${a.subjectId}`)),
  })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const pairKey = (teacherId, subjectId) => `${teacherId}|${subjectId}`

  const selectedClasses = (classes ?? []).filter((c) => form.classIds.has(c.id))
  const inheritedStudentCount = selectedClasses.length > 0
    ? selectedClasses.reduce((sum, cls) => sum + (cls.studentCount ?? 0), 0)
    : null
  // Class homeRoom allows 50 chars but a Lesson's homeRoom caps at 30 (LessonConfiguration).
  // Only inherit when the class value fits, otherwise the inherited POST would 400.
  const inheritedHomeRoom = selectedClasses.length === 1
    && (selectedClasses[0].homeRoom?.length ?? 0) <= 30
    ? selectedClasses[0].homeRoom
    : null
  const shouldInheritStudentCount = form.numberOfStudents === '' && inheritedStudentCount !== null
  const shouldInheritHomeRoom = form.homeRoom.trim() === '' && Boolean(inheritedHomeRoom)

  const toggleId = (key, id) =>
    setForm((f) => {
      const next = new Set(f[key])
      if (next.has(id)) next.delete(id)
      else next.add(id)
      // Deselecting the lead teacher clears the lead — never submit a non-member lead.
      const leadTeacherId =
        key === 'teacherIds' && !next.has(f.leadTeacherId) ? '' : f.leadTeacherId
      // Prune any pairing that references a teacher/subject no longer selected.
      let assignments = f.assignments
      if (key === 'teacherIds' || key === 'subjectIds') {
        const teacherSet = key === 'teacherIds' ? next : f.teacherIds
        const subjectSet = key === 'subjectIds' ? next : f.subjectIds
        assignments = new Set(
          [...f.assignments].filter((pk) => {
            const [tid, sid] = pk.split('|')
            return teacherSet.has(tid) && subjectSet.has(sid)
          }),
        )
      }
      return { ...f, [key]: next, leadTeacherId, assignments }
    })

  const toggleAssignment = (teacherId, subjectId) =>
    setForm((f) => {
      const next = new Set(f.assignments)
      const key = pairKey(teacherId, subjectId)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return { ...f, assignments: next }
    })

  const isCoTeaching = form.teacherIds.size > 1
  const isMultiSubject = form.subjectIds.size > 1
  const selectedTeachers = (teachers ?? []).filter((t) => form.teacherIds.has(t.id))
  const selectedSubjects = (subjects ?? []).filter((s) => form.subjectIds.has(s.id))
  const teacherLabel = (t) =>
    `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim() || t.username || t.id
  const subjectLabel = (s) => s.name || s.code || s.id

  // Show the "who teaches what" matrix once there's more than one subject or teacher to
  // disambiguate — a single teacher/subject lesson has nothing to pair.
  const showAssignments =
    form.teacherIds.size > 0 &&
    form.subjectIds.size > 0 &&
    (form.subjectIds.size > 1 || form.teacherIds.size > 1)

  const handleSubmit = (e) => {
    e.preventDefault()
    const core = {
      duration: parseInt(form.duration) || 1,
      frequencyPerWeek: parseInt(form.frequencyPerWeek) || 1,
      requiredRoomType: form.requiredRoomType || null,
      priority: form.priority === '' ? null : parseInt(form.priority),
      numberOfStudents: shouldInheritStudentCount
        ? inheritedStudentCount
        : form.numberOfStudents === '' ? null : parseInt(form.numberOfStudents),
      studentGroup: form.studentGroup.trim() || null,
      homeRoom: shouldInheritHomeRoom ? inheritedHomeRoom : form.homeRoom.trim() || null,
      specialRequirements: form.specialRequirements.trim() || null,
      leadTeacherId: isCoTeaching ? form.leadTeacherId || null : null,
    }
    // Only submit pairings that still reference selected teachers AND subjects.
    const assignments = [...form.assignments]
      .map((pk) => {
        const [teacherId, subjectId] = pk.split('|')
        return { teacherId, subjectId }
      })
      .filter((a) => form.teacherIds.has(a.teacherId) && form.subjectIds.has(a.subjectId))
    onSubmit({
      core,
      teacherIds: [...form.teacherIds],
      classIds: [...form.classIds],
      subjectIds: [...form.subjectIds],
      assignments,
    })
  }

  return (
    <EntityFormModal
      title={mode === 'create' ? 'New Lesson' : 'Edit Lesson'}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="ef-grid">
        <div className="ef-field">
          <label className="ef-label ef-label-required">Duration (periods)</label>
          <input
            className="ef-input"
            type="number"
            min="1"
            max="10"
            value={form.duration}
            onChange={set('duration')}
            required
            autoFocus
          />
        </div>
        <div className="ef-field">
          <label className="ef-label ef-label-required">Frequency / week</label>
          <input
            className="ef-input"
            type="number"
            min="1"
            max="20"
            value={form.frequencyPerWeek}
            onChange={set('frequencyPerWeek')}
            required
          />
        </div>
        <div className="ef-field">
          <label className="ef-label">Required Room Type</label>
          <select className="ef-select" value={form.requiredRoomType} onChange={set('requiredRoomType')}>
            <option value="">— None —</option>
            {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            {form.requiredRoomType && !ROOM_TYPES.includes(form.requiredRoomType) && (
              <option value={form.requiredRoomType}>{form.requiredRoomType} (legacy)</option>
            )}
          </select>
        </div>
        <div className="ef-field">
          <label className="ef-label">Priority</label>
          <input
            className="ef-input"
            type="number"
            value={form.priority}
            onChange={set('priority')}
          />
        </div>
        <div className="ef-field">
          <label className="ef-label"># of Students</label>
          <input
            className="ef-input"
            type="number"
            min="0"
            value={form.numberOfStudents}
            onChange={set('numberOfStudents')}
            placeholder={inheritedStudentCount === null ? '' : String(inheritedStudentCount)}
          />
          {shouldInheritStudentCount && <span style={inheritHint}>Inherited from selected class.</span>}
        </div>
        <div className="ef-field">
          <label className="ef-label">Student Group</label>
          <input
            className="ef-input"
            value={form.studentGroup}
            onChange={set('studentGroup')}
            maxLength={100}
          />
        </div>
        <div className="ef-field">
          <label className="ef-label">Home Room</label>
          <input
            className="ef-input"
            value={form.homeRoom}
            onChange={set('homeRoom')}
            maxLength={30}
            placeholder={inheritedHomeRoom ?? ''}
          />
          {shouldInheritHomeRoom && <span style={inheritHint}>Inherited from selected class.</span>}
        </div>
        <div className="ef-field ef-col-full">
          <label className="ef-label">Special Requirements</label>
          <input
            className="ef-input"
            value={form.specialRequirements}
            onChange={set('specialRequirements')}
            maxLength={500}
          />
        </div>

        <div className="ef-field ef-col-full">
          <label className="ef-label">Lesson Type</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {isCoTeaching && <TypeChip bg="#eef4ff" color="#1e40af">Co-teaching</TypeChip>}
            {isMultiSubject && <TypeChip bg="#f5f3ff" color="#5b21b6">Multi-subject</TypeChip>}
            {!isCoTeaching && !isMultiSubject && <TypeChip bg="#f3f4f6" color="#4b5563">Standard</TypeChip>}
          </div>
        </div>

        <MembershipPicker
          label="Teachers"
          required
          options={teachers}
          getLabel={(t) => `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim() || t.username || t.id}
          selected={form.teacherIds}
          onToggle={(id) => toggleId('teacherIds', id)}
        />
        {isCoTeaching && (
          <div className="ef-field ef-col-full">
            <label className="ef-label">Lead Teacher</label>
            <select
              className="ef-select"
              value={form.leadTeacherId}
              onChange={set('leadTeacherId')}
            >
              <option value="">— No lead designated —</option>
              {selectedTeachers.map((t) => (
                <option key={t.id} value={t.id}>{teacherLabel(t)}</option>
              ))}
            </select>
          </div>
        )}
        <MembershipPicker
          label="Classes"
          required
          options={classes}
          getLabel={(c) => c.name || c.code || c.id}
          selected={form.classIds}
          onToggle={(id) => toggleId('classIds', id)}
        />
        <MembershipPicker
          label="Subjects"
          required
          options={subjects}
          getLabel={(s) => s.name || s.code || s.id}
          selected={form.subjectIds}
          onToggle={(id) => toggleId('subjectIds', id)}
        />

        {showAssignments && (
          <div className="ef-field ef-col-full">
            <label className="ef-label">Who teaches what (optional)</label>
            <span style={inheritHint}>
              Tick which teacher teaches which subject. Leave blank to keep the lesson's
              teachers and subjects unpaired.
            </span>
            <div style={matrixWrap}>
              <table style={matrixTable}>
                <thead>
                  <tr>
                    <th style={matrixCornerTh}>Subject \ Teacher</th>
                    {selectedTeachers.map((t) => (
                      <th key={t.id} style={matrixTh}>{teacherLabel(t)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedSubjects.map((s) => (
                    <tr key={s.id}>
                      <td style={matrixRowTh}>{subjectLabel(s)}</td>
                      {selectedTeachers.map((t) => (
                        <td key={t.id} style={matrixCell}>
                          <input
                            type="checkbox"
                            checked={form.assignments.has(pairKey(t.id, s.id))}
                            onChange={() => toggleAssignment(t.id, s.id)}
                            aria-label={`${teacherLabel(t)} teaches ${subjectLabel(s)}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </EntityFormModal>
  )
}

const matrixWrap = { overflowX: 'auto', border: '1px solid var(--border-soft, #ddd)', borderRadius: 6, marginTop: 6 }
const matrixTable = { borderCollapse: 'collapse', fontSize: 13, width: '100%' }
const matrixTh = { padding: '6px 10px', borderBottom: '1px solid var(--border-soft, #ddd)', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }
const matrixCornerTh = { ...matrixTh, textAlign: 'left', color: 'var(--text-soft, #888)', fontWeight: 500 }
const matrixRowTh = { padding: '6px 10px', borderBottom: '1px solid var(--border-soft, #eee)', fontWeight: 600, whiteSpace: 'nowrap' }
const matrixCell = { padding: '6px 10px', borderBottom: '1px solid var(--border-soft, #eee)', textAlign: 'center' }

const inheritHint = { fontSize: 11, color: 'var(--text-soft, #888)', marginTop: 2 }

const TypeChip = ({ bg, color, children }) => (
  <span style={{
    background: bg, color, borderRadius: 999, padding: '3px 12px',
    fontSize: 12, fontWeight: 700, letterSpacing: 0.3,
  }}>
    {children}
  </span>
)

const MembershipPicker = ({ label, required, options, getLabel, selected, onToggle }) => (
  <div className="ef-field ef-col-full">
    <label className={`ef-label${required ? ' ef-label-required' : ''}`}>
      {label} ({selected.size} selected)
    </label>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '6px 12px',
        maxHeight: '180px',
        overflowY: 'auto',
        padding: '8px',
        border: '1px solid var(--border-soft, #ddd)',
        borderRadius: '6px',
      }}
    >
      {(options ?? []).map((o) => (
        <label key={o.id} style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={selected.has(o.id)}
            onChange={() => onToggle(o.id)}
          />
          <span>{getLabel(o)}</span>
        </label>
      ))}
      {(options ?? []).length === 0 && (
        <span style={{ color: 'var(--text-soft, #888)', fontSize: '12px' }}>No options available</span>
      )}
    </div>
  </div>
)

export default LessonForm
