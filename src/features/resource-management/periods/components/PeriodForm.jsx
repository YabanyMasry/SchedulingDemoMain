import { useState } from 'react'
import EntityFormModal from '../../components/common/EntityFormModal'

const PeriodForm = ({ mode, initial, onClose, onSubmit, isSubmitting }) => {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    periodNumber: initial?.periodNumber ?? 1,
    startTime: initial?.startTime ? String(initial.startTime).substring(0, 5) : '',
    endTime: initial?.endTime ? String(initial.endTime).substring(0, 5) : '',
    isBreak: initial?.isBreak ?? false,
  })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const check = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.checked }))

  // <input type="time"> yields "HH:MM"; the API binds a TimeSpan which System.Text.Json only
  // parses from "HH:MM:SS" — without the seconds the request 400s. Normalise before sending.
  const toTimeSpan = (t) => (t && t.length === 5 ? `${t}:00` : t)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      name: form.name.trim(),
      periodNumber: parseInt(form.periodNumber) || 1,
      startTime: toTimeSpan(form.startTime),
      endTime: toTimeSpan(form.endTime),
      isBreak: form.isBreak,
    })
  }

  return (
    <EntityFormModal
      title={mode === 'create' ? 'New Period' : 'Edit Period'}
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
          <label className="ef-label ef-label-required">Period #</label>
          <input
            className="ef-input"
            type="number"
            min="1"
            value={form.periodNumber}
            onChange={set('periodNumber')}
            required
          />
        </div>
        <div className="ef-field">
          <label className="ef-label ef-label-required">Start Time</label>
          <input
            className="ef-input"
            type="time"
            value={form.startTime}
            onChange={set('startTime')}
            required
          />
        </div>
        <div className="ef-field">
          <label className="ef-label ef-label-required">End Time</label>
          <input
            className="ef-input"
            type="time"
            value={form.endTime}
            onChange={set('endTime')}
            required
          />
        </div>
        <div className="ef-field ef-col-full">
          <label className="ef-checkbox-row">
            <input type="checkbox" checked={form.isBreak} onChange={check('isBreak')} />
            Break period (not a teaching slot)
          </label>
        </div>
      </div>
    </EntityFormModal>
  )
}

export default PeriodForm
