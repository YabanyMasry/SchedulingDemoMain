import { useState } from 'react'
import EntityFormModal from '../../components/common/EntityFormModal'

// Trims an ISO datetime down to the YYYY-MM-DD a <input type="date"> expects.
const toDateInput = (iso) => (iso ? String(iso).slice(0, 10) : '')

const TermForm = ({ mode = 'create', initial, schoolYearId, schoolYearName, onClose, onSubmit, isSubmitting }) => {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    startDate: toDateInput(initial?.startDate),
    endDate: toDateInput(initial?.endDate),
  })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const base = {
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
    }
    // Edit keeps the term's owning school year; create needs it set explicitly.
    onSubmit(isEdit ? { id: initial.id, ...base } : { ...base, schoolYearId })
  }

  const suffix = schoolYearName ? ` — ${schoolYearName}` : ''
  return (
    <EntityFormModal
      title={`${isEdit ? 'Edit Term' : 'New Term'}${suffix}`}
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
            placeholder="e.g. Fall 2025"
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
      </div>
    </EntityFormModal>
  )
}

export default TermForm
