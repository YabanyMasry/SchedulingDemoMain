import { useState } from 'react'
import EntityFormModal from '../../components/common/EntityFormModal'

const StudentForm = ({ mode, initial, onClose, onSubmit, isSubmitting, classes }) => {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    fullName: initial?.fullName ?? '',
    studentNumber: initial?.studentNumber ?? '',
    classId: initial?.classId ?? '',
    email: initial?.email ?? '',
    gender: initial?.gender != null ? String(initial.gender) : '',
  })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      name: form.name.trim(),
      fullName: form.fullName.trim() || null,
      studentNumber: form.studentNumber.trim(),
      classId: form.classId || null,
      email: form.email.trim() || null,
      gender: form.gender !== '' ? parseInt(form.gender) : null,
    })
  }

  return (
    <EntityFormModal
      title={mode === 'create' ? 'New Student' : 'Edit Student'}
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
            maxLength={200}
            autoFocus
          />
        </div>
        <div className="ef-field">
          <label className="ef-label">Full Name</label>
          <input
            className="ef-input"
            value={form.fullName}
            onChange={set('fullName')}
            maxLength={300}
          />
        </div>
        <div className="ef-field">
          <label className="ef-label ef-label-required">Student #</label>
          <input
            className="ef-input"
            value={form.studentNumber}
            onChange={set('studentNumber')}
            required
            maxLength={50}
          />
        </div>
        <div className="ef-field">
          <label className="ef-label">Gender</label>
          <select className="ef-select" value={form.gender} onChange={set('gender')}>
            <option value="">— None —</option>
            <option value="0">Male</option>
            <option value="1">Female</option>
          </select>
        </div>
        <div className="ef-field">
          <label className="ef-label">Class</label>
          <select className="ef-select" value={form.classId} onChange={set('classId')}>
            <option value="">— None —</option>
            {(classes ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="ef-field">
          <label className={`ef-label ${mode === 'create' ? 'ef-label-required' : ''}`}>Email</label>
          <input
            className="ef-input"
            type="email"
            value={form.email}
            onChange={set('email')}
            required={mode === 'create'}
            maxLength={200}
          />
          {mode === 'create' && (
            <span className="ef-hint">
              Used to provision the student's login. A magic-link email is sent on save.
            </span>
          )}
        </div>
      </div>
    </EntityFormModal>
  )
}

export default StudentForm
