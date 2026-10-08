import { useState } from 'react'
import EntityFormModal from '../../components/common/EntityFormModal'

// Trims an ISO datetime down to the YYYY-MM-DD a <input type="date"> expects.
const toDateInput = (iso) => (iso ? String(iso).slice(0, 10) : '')

const SchoolYearForm = ({ mode = 'create', initial, onClose, onSubmit, isSubmitting }) => {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    startDate: toDateInput(initial?.startDate),
    endDate: toDateInput(initial?.endDate),
    isActive: initial?.isActive ?? true,
  })
  const set = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const base = {
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
    }
    // The active flag is set only at creation; editing covers name/dates (the API keeps
    // active state on its own Activate/Deactivate path).
    onSubmit(isEdit ? { id: initial.id, ...base } : { ...base, isActive: form.isActive })
  }

  return (
    <EntityFormModal
      title={isEdit ? 'Edit School Year' : 'New School Year'}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="ef-grid">
        <div className="ef-field ef-col-full">
          <label className="ef-label ef-label-required">Name</label>
          <input
            className="ef-input"
            value={form.name}
            onChange={set('name')}
            required
            maxLength={100}
            placeholder="e.g. 2025-2026"
            autoFocus
          />
        </div>
        <div className="ef-field">
          <label className="ef-label ef-label-required">Start Date</label>
          <input
            className="ef-input"
            type="date"
            value={form.startDate}
            onChange={set('startDate')}
            required
          />
        </div>
        <div className="ef-field">
          <label className="ef-label ef-label-required">End Date</label>
          <input
            className="ef-input"
            type="date"
            value={form.endDate}
            onChange={set('endDate')}
            required
          />
        </div>
        {!isEdit && (
          <div className="ef-field ef-col-full">
            <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="checkbox" checked={form.isActive} onChange={set('isActive')} />
              <span>Active</span>
            </label>
          </div>
        )}
      </div>
    </EntityFormModal>
  )
}

export default SchoolYearForm
