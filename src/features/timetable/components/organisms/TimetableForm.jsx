import { useMemo, useState } from 'react'
import EntityFormModal from '../../../resource-management/components/common/EntityFormModal'

const TimetableForm = ({
  mode,
  initial,
  schoolYears,
  terms,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    schoolYearId: initial?.schoolYearId ?? '',
    termId: initial?.termId ?? '',
    notes: initial?.notes ?? '',
  })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const termOptions = useMemo(
    () => (terms ?? []).filter((t) => !form.schoolYearId || t.schoolYearId === form.schoolYearId),
    [terms, form.schoolYearId],
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (mode === 'rename') {
      onSubmit({ newName: form.name.trim() })
      return
    }
    onSubmit({
      name: form.name.trim(),
      schoolYearId: form.schoolYearId,
      termId: form.termId || null,
      notes: form.notes.trim() || null,
    })
  }

  return (
    <EntityFormModal
      title={mode === 'rename' ? 'Rename Timetable' : 'New Timetable'}
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
            maxLength={200}
            autoFocus
          />
        </div>
        {mode !== 'rename' && (
          <>
            <div className="ef-field">
              <label className="ef-label ef-label-required">School Year</label>
              <select
                className="ef-select"
                value={form.schoolYearId}
                onChange={set('schoolYearId')}
                required
              >
                <option value="">— Select —</option>
                {(schoolYears ?? []).map((y) => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>
            <div className="ef-field">
              <label className="ef-label">Term</label>
              <select
                className="ef-select"
                value={form.termId}
                onChange={set('termId')}
                disabled={!form.schoolYearId}
              >
                <option value="">— None —</option>
                {termOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="ef-field ef-col-full">
              <label className="ef-label">Notes</label>
              <input
                className="ef-input"
                value={form.notes}
                onChange={set('notes')}
                maxLength={1000}
              />
            </div>
          </>
        )}
      </div>
    </EntityFormModal>
  )
}

export default TimetableForm
