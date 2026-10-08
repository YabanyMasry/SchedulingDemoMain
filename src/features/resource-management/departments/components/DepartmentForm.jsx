import { useState } from 'react'
import EntityFormModal from '../../components/common/EntityFormModal'

const DepartmentForm = ({ mode, initial, onClose, onSubmit, isSubmitting }) => {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    fullName: initial?.fullName ?? '',
  })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      name: form.name.trim(),
      fullName: form.fullName.trim() || null,
    })
  }

  return (
    <EntityFormModal
      title={mode === 'create' ? 'New Department' : 'Edit Department'}
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
            autoFocus
          />
        </div>
        <div className="ef-field ef-col-full">
          <label className="ef-label">Full Name</label>
          <input
            className="ef-input"
            value={form.fullName}
            onChange={set('fullName')}
            maxLength={200}
          />
        </div>
      </div>
    </EntityFormModal>
  )
}

export default DepartmentForm
