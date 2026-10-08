import { useState } from 'react'
import EntityFormModal from '../../components/common/EntityFormModal'
import { ROOM_TYPES } from '../../common/roomTypes'

const SubjectForm = ({ mode, initial, onClose, onSubmit, isSubmitting, departments, rooms }) => {
  const [form, setForm] = useState({
    code: initial?.code ?? '',
    name: initial?.name ?? '',
    departmentId: initial?.departmentId ?? '',
    category: initial?.category ?? '',
    preferredRoomId: initial?.preferredRoomId ?? '',
    requiredRoomType: initial?.requiredRoomType ?? '',
    minPeriodsPerWeek: initial?.minPeriodsPerWeek ?? 0,
    maxPeriodsPerWeek: initial?.maxPeriodsPerWeek ?? 0,
    minPeriodsPerDay: initial?.minPeriodsPerDay ?? 0,
    maxPeriodsPerDay: initial?.maxPeriodsPerDay ?? 0,
    consecutivePeriodsClass: initial?.consecutivePeriodsClass ?? 0,
    consecutivePeriodsTeacher: initial?.consecutivePeriodsTeacher ?? 0,
    factor: initial?.factor ?? 1,
  })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      code: form.code.trim(),
      name: form.name.trim(),
      departmentId: form.departmentId || null,
      category: form.category.trim() || null,
      preferredRoomId: form.preferredRoomId || null,
      requiredRoomType: form.requiredRoomType || null,
      minPeriodsPerWeek: parseInt(form.minPeriodsPerWeek) || 0,
      maxPeriodsPerWeek: parseInt(form.maxPeriodsPerWeek) || 0,
      minPeriodsPerDay: parseInt(form.minPeriodsPerDay) || 0,
      maxPeriodsPerDay: parseInt(form.maxPeriodsPerDay) || 0,
      consecutivePeriodsClass: parseInt(form.consecutivePeriodsClass) || 0,
      consecutivePeriodsTeacher: parseInt(form.consecutivePeriodsTeacher) || 0,
      factor: parseFloat(form.factor) || 1,
    })
  }

  return (
    <EntityFormModal
      title={mode === 'create' ? 'New Subject' : 'Edit Subject'}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="ef-grid">
        <div className="ef-field">
          <label className="ef-label ef-label-required">Code</label>
          <input
            className="ef-input"
            value={form.code}
            onChange={set('code')}
            required
            maxLength={20}
            autoFocus
          />
        </div>
        <div className="ef-field">
          <label className="ef-label ef-label-required">Name</label>
          <input className="ef-input" value={form.name} onChange={set('name')} required maxLength={200} />
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
          <label className="ef-label">Category</label>
          <input className="ef-input" value={form.category} onChange={set('category')} maxLength={100} />
        </div>
        <div className="ef-field">
          <label className="ef-label">Preferred Room</label>
          <select className="ef-select" value={form.preferredRoomId} onChange={set('preferredRoomId')}>
            <option value="">— None —</option>
            {(rooms ?? []).map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
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
          <label className="ef-label">Factor</label>
          <input
            className="ef-input"
            type="number"
            min="0"
            step="0.1"
            value={form.factor}
            onChange={set('factor')}
          />
        </div>

        <div className="ef-section">Periods per Week</div>
        <div className="ef-field">
          <label className="ef-label">Min / Week</label>
          <input className="ef-input" type="number" min="0" value={form.minPeriodsPerWeek} onChange={set('minPeriodsPerWeek')} />
        </div>
        <div className="ef-field">
          <label className="ef-label">Max / Week</label>
          <input className="ef-input" type="number" min="0" value={form.maxPeriodsPerWeek} onChange={set('maxPeriodsPerWeek')} />
        </div>
        <div className="ef-field">
          <label className="ef-label">Min / Day</label>
          <input className="ef-input" type="number" min="0" value={form.minPeriodsPerDay} onChange={set('minPeriodsPerDay')} />
        </div>
        <div className="ef-field">
          <label className="ef-label">Max / Day</label>
          <input className="ef-input" type="number" min="0" value={form.maxPeriodsPerDay} onChange={set('maxPeriodsPerDay')} />
        </div>

        <div className="ef-section">Consecutive Periods</div>
        <div className="ef-field">
          <label className="ef-label">Per Class</label>
          <input className="ef-input" type="number" min="0" value={form.consecutivePeriodsClass} onChange={set('consecutivePeriodsClass')} />
        </div>
        <div className="ef-field">
          <label className="ef-label">Per Teacher</label>
          <input className="ef-input" type="number" min="0" value={form.consecutivePeriodsTeacher} onChange={set('consecutivePeriodsTeacher')} />
        </div>
      </div>
    </EntityFormModal>
  )
}

export default SubjectForm
