import { useState } from 'react'
import EntityFormModal from '../../components/common/EntityFormModal'

const NOTIFICATION_OPTIONS = [
  { value: 1, label: 'Email' },
  { value: 2, label: 'SMS' },
  { value: 3, label: 'Both' },
  { value: 4, label: 'Phone' },
]

const TeacherForm = ({ mode, initial, onClose, onSubmit, isSubmitting, departments }) => {
  const [form, setForm] = useState({
    firstName: initial?.firstName ?? '',
    lastName: initial?.lastName ?? '',
    title: initial?.title ?? '',
    email: initial?.email ?? '',
    phoneNumber: initial?.phoneNumber ?? '',
    mobileNumber: initial?.mobileNumber ?? '',
    departmentId: initial?.departmentId ?? '',
    homeRoom: initial?.homeRoom ?? '',
    weeklyQuota: initial?.weeklyQuota ?? 0,
    gender: initial?.gender ?? '',
    availableForSubstitution: initial?.availableForSubstitution ?? false,
    maxSubstitutionsPerWeek: initial?.maxSubstitutionsPerWeek ?? 0,
    substitutionHourlyRate: initial?.substitutionHourlyRate ?? 0,
    substitutionPreferences: initial?.substitutionPreferences ?? '',
    substitutionQualificationNotes: initial?.substitutionQualificationNotes ?? '',
    preferredNotification: initial?.preferredNotification ?? 1,
    dateOfBirth: initial?.dateOfBirth ? String(initial.dateOfBirth).substring(0, 10) : '',
    personnelNumber: initial?.personnelNumber ?? '',
  })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const check = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.checked }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim() || null,
      title: form.title.trim() || null,
      email: form.email.trim() || null,
      phoneNumber: form.phoneNumber.trim() || null,
      mobileNumber: form.mobileNumber.trim() || null,
      departmentId: form.departmentId || null,
      homeRoom: form.homeRoom.trim() || null,
      weeklyQuota: parseFloat(form.weeklyQuota) || 0,
      status: null,
      gender: form.gender.trim() || null,
      availableForSubstitution: form.availableForSubstitution,
      maxSubstitutionsPerWeek: parseInt(form.maxSubstitutionsPerWeek) || 0,
      substitutionHourlyRate: parseFloat(form.substitutionHourlyRate) || 0,
      substitutionPreferences: form.substitutionPreferences.trim() || null,
      substitutionQualificationNotes: form.substitutionQualificationNotes.trim() || null,
      preferredNotification: parseInt(form.preferredNotification) || 1,
      dateOfBirth: form.dateOfBirth || null,
      personnelNumber: form.personnelNumber.trim() || null,
      userId: null,
    })
  }

  return (
    <EntityFormModal
      title={mode === 'create' ? 'New Teacher' : 'Edit Teacher'}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="ef-grid">
        <div className="ef-field">
          <label className="ef-label ef-label-required">First Name</label>
          <input
            className="ef-input"
            value={form.firstName}
            onChange={set('firstName')}
            required
            maxLength={100}
            autoFocus
          />
        </div>
        <div className="ef-field">
          <label className="ef-label">Last Name</label>
          <input className="ef-input" value={form.lastName} onChange={set('lastName')} maxLength={100} />
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
              Used to provision the teacher's login. A magic-link email is sent on save.
            </span>
          )}
        </div>
        <div className="ef-field">
          <label className="ef-label">Personnel #</label>
          <input className="ef-input" value={form.personnelNumber} onChange={set('personnelNumber')} maxLength={50} />
        </div>

        <div className="ef-field">
          <label className="ef-label">Title</label>
          <input className="ef-input" value={form.title} onChange={set('title')} maxLength={50} />
        </div>
        <div className="ef-field">
          <label className="ef-label">Phone</label>
          <input className="ef-input" value={form.phoneNumber} onChange={set('phoneNumber')} maxLength={50} />
        </div>
        <div className="ef-field">
          <label className="ef-label">Mobile</label>
          <input className="ef-input" value={form.mobileNumber} onChange={set('mobileNumber')} maxLength={50} />
        </div>
        <div className="ef-field">
          <label className="ef-label">Home Room</label>
          <input className="ef-input" value={form.homeRoom} onChange={set('homeRoom')} maxLength={50} />
        </div>
        <div className="ef-field">
          <label className="ef-label">Weekly Quota</label>
          <input
            className="ef-input"
            type="number"
            min="0"
            step="0.5"
            value={form.weeklyQuota}
            onChange={set('weeklyQuota')}
          />
        </div>
        <div className="ef-field">
          <label className="ef-label">Gender</label>
          <select className="ef-select" value={form.gender} onChange={set('gender')}>
            <option value="">— None —</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div className="ef-field">
          <label className="ef-label">Date of Birth</label>
          <input className="ef-input" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
        </div>
        <div className="ef-field">
          <label className="ef-label">Notification</label>
          <select
            className="ef-select"
            value={form.preferredNotification}
            onChange={(e) => setForm((f) => ({ ...f, preferredNotification: parseInt(e.target.value) }))}
          >
            {NOTIFICATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="ef-section">Substitution</div>
        <div className="ef-field ef-col-full">
          <label className="ef-checkbox-row">
            <input
              type="checkbox"
              checked={form.availableForSubstitution}
              onChange={check('availableForSubstitution')}
            />
            Available for substitution
          </label>
        </div>
        <div className="ef-field">
          <label className="ef-label">Max Subs / Week</label>
          <input
            className="ef-input"
            type="number"
            min="0"
            value={form.maxSubstitutionsPerWeek}
            onChange={set('maxSubstitutionsPerWeek')}
          />
        </div>
        <div className="ef-field">
          <label className="ef-label">Hourly Rate</label>
          <input
            className="ef-input"
            type="number"
            min="0"
            step="0.01"
            value={form.substitutionHourlyRate}
            onChange={set('substitutionHourlyRate')}
          />
        </div>
        <div className="ef-field ef-col-full">
          <label className="ef-label">Preferences</label>
          <input
            className="ef-input"
            value={form.substitutionPreferences}
            onChange={set('substitutionPreferences')}
            maxLength={500}
          />
        </div>
        <div className="ef-field ef-col-full">
          <label className="ef-label">Qualification Notes</label>
          <input
            className="ef-input"
            value={form.substitutionQualificationNotes}
            onChange={set('substitutionQualificationNotes')}
            maxLength={500}
          />
        </div>
      </div>
    </EntityFormModal>
  )
}

export default TeacherForm
