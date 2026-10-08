import { useState } from 'react'
import EntityFormModal from '../../components/common/EntityFormModal'

const ClassForm = ({ mode, initial, onClose, onSubmit, isSubmitting, departments, teachers, classes }) => {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    fullName: initial?.fullName ?? '',
    yearLevel: initial?.yearLevel ?? 1,
    departmentId: initial?.departmentId ?? '',
    classTeacherId: initial?.classTeacherId ?? '',
    parentClassId: initial?.parentClassId ?? '',
    homeRoom: initial?.homeRoom ?? '',
    maleStudents: initial?.maleStudents ?? 0,
    femaleStudents: initial?.femaleStudents ?? 0,
    maxPeriodsPerDay: initial?.maxPeriodsPerDay ?? 8,
    maxConsecutiveSubjects: initial?.maxConsecutiveSubjects ?? 2,
    consecutiveMainSubjects: initial?.consecutiveMainSubjects ?? 1,
  })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const parentOptions = (classes ?? []).filter((c) => c.id !== initial?.id)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      name: form.name.trim(),
      fullName: form.fullName.trim() || null,
      yearLevel: parseInt(form.yearLevel) || 1,
      departmentId: form.departmentId || null,
      classTeacherId: form.classTeacherId || null,
      parentClassId: form.parentClassId || null,
      homeRoom: form.homeRoom.trim() || null,
      maleStudents: parseInt(form.maleStudents) || 0,
      femaleStudents: parseInt(form.femaleStudents) || 0,
      maxPeriodsPerDay: parseInt(form.maxPeriodsPerDay) || 8,
      maxConsecutiveSubjects: parseInt(form.maxConsecutiveSubjects) || 2,
      consecutiveMainSubjects: parseInt(form.consecutiveMainSubjects) || 1,
    })
  }

  return (
    <EntityFormModal
      title={mode === 'create' ? 'New Class' : 'Edit Class'}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="ef-grid">
        <div className="ef-field">
          <label className="ef-label ef-label-required">Name</label>
          <input
            className="ef-input"
            value={form.name}
            onChange={set('name')}
            required
            maxLength={100}
            autoFocus
          />
        </div>
        <div className="ef-field">
          <label className="ef-label">Full Name</label>
          <input className="ef-input" value={form.fullName} onChange={set('fullName')} maxLength={200} />
        </div>
        <div className="ef-field">
          <label className="ef-label ef-label-required">Year Level</label>
          <input
            className="ef-input"
            type="number"
            min="1"
            max="12"
            value={form.yearLevel}
            onChange={set('yearLevel')}
            required
          />
        </div>
        <div className="ef-field">
          <label className="ef-label">Home Room</label>
          <input className="ef-input" value={form.homeRoom} onChange={set('homeRoom')} maxLength={50} />
        </div>
        <div className="ef-field">
          <label className="ef-label">Department</label>
          <select className="ef-select" value={form.departmentId} onChange={set('departmentId')}>
            <option value="">— None —</option>
            {(departments ?? []).map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="ef-field">
          <label className="ef-label">Class Teacher</label>
          <select className="ef-select" value={form.classTeacherId} onChange={set('classTeacherId')}>
            <option value="">— None —</option>
            {(teachers ?? []).map((t) => (
              <option key={t.id} value={t.id}>{t.displayName}</option>
            ))}
          </select>
        </div>
        <div className="ef-field ef-col-full">
          <label className="ef-label">Parent Class</label>
          <select className="ef-select" value={form.parentClassId} onChange={set('parentClassId')}>
            <option value="">— None —</option>
            {parentOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="ef-section">Students</div>
        <div className="ef-field">
          <label className="ef-label">Male Students</label>
          <input className="ef-input" type="number" min="0" value={form.maleStudents} onChange={set('maleStudents')} />
        </div>
        <div className="ef-field">
          <label className="ef-label">Female Students</label>
          <input className="ef-input" type="number" min="0" value={form.femaleStudents} onChange={set('femaleStudents')} />
        </div>

        <div className="ef-section">Schedule Constraints</div>
        <div className="ef-field">
          <label className="ef-label ef-label-required">Max Periods / Day</label>
          <input
            className="ef-input"
            type="number"
            min="1"
            max="12"
            value={form.maxPeriodsPerDay}
            onChange={set('maxPeriodsPerDay')}
            required
          />
        </div>
        <div className="ef-field">
          <label className="ef-label ef-label-required">Max Consecutive Subjects</label>
          <input
            className="ef-input"
            type="number"
            min="0"
            value={form.maxConsecutiveSubjects}
            onChange={set('maxConsecutiveSubjects')}
            required
          />
        </div>
        <div className="ef-field">
          <label className="ef-label ef-label-required">Consecutive Main Subjects</label>
          <input
            className="ef-input"
            type="number"
            min="0"
            value={form.consecutiveMainSubjects}
            onChange={set('consecutiveMainSubjects')}
            required
          />
        </div>
      </div>
    </EntityFormModal>
  )
}

export default ClassForm
