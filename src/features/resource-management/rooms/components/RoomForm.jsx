import { useState } from 'react'
import EntityFormModal from '../../components/common/EntityFormModal'
import { ROOM_TYPES } from '../../common/roomTypes'

const RoomForm = ({ mode, initial, onClose, onSubmit, isSubmitting, departments, rooms }) => {
  const [form, setForm] = useState({
    roomNumber: initial?.roomNumber ?? '',
    name: initial?.name ?? '',
    roomType: initial?.roomType ?? '',
    capacity: initial?.capacity ?? 30,
    departmentId: initial?.departmentId ?? '',
    alternativeRoomId: initial?.alternativeRoomId ?? '',
    building: initial?.building ?? '',
    floor: initial?.floor ?? '',
    facilities: initial?.facilities ?? '',
  })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const altRoomOptions = (rooms ?? []).filter((r) => r.id !== initial?.id)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      roomNumber: form.roomNumber.trim(),
      name: form.name.trim(),
      roomType: form.roomType || null,
      capacity: parseInt(form.capacity) || 0,
      departmentId: form.departmentId || null,
      alternativeRoomId: form.alternativeRoomId || null,
      building: form.building.trim() || null,
      floor: form.floor.trim() || null,
      facilities: form.facilities.trim() || null,
    })
  }

  return (
    <EntityFormModal
      title={mode === 'create' ? 'New Room' : 'Edit Room'}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="ef-grid">
        <div className="ef-field">
          <label className="ef-label ef-label-required">Room #</label>
          <input
            className="ef-input"
            value={form.roomNumber}
            onChange={set('roomNumber')}
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
          <label className="ef-label">Room Type</label>
          <select className="ef-select" value={form.roomType} onChange={set('roomType')}>
            <option value="">— None —</option>
            {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            {form.roomType && !ROOM_TYPES.includes(form.roomType) && (
              <option value={form.roomType}>{form.roomType} (legacy)</option>
            )}
          </select>
        </div>
        <div className="ef-field">
          <label className="ef-label ef-label-required">Capacity</label>
          <input
            className="ef-input"
            type="number"
            min="0"
            value={form.capacity}
            onChange={set('capacity')}
            required
          />
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
          <label className="ef-label">Alternative Room</label>
          <select className="ef-select" value={form.alternativeRoomId} onChange={set('alternativeRoomId')}>
            <option value="">— None —</option>
            {altRoomOptions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="ef-field">
          <label className="ef-label">Building</label>
          <input className="ef-input" value={form.building} onChange={set('building')} maxLength={100} />
        </div>
        <div className="ef-field">
          <label className="ef-label">Floor</label>
          <input className="ef-input" value={form.floor} onChange={set('floor')} maxLength={50} />
        </div>
        <div className="ef-field ef-col-full">
          <label className="ef-label">Facilities</label>
          <input className="ef-input" value={form.facilities} onChange={set('facilities')} maxLength={500} />
        </div>
      </div>
    </EntityFormModal>
  )
}

export default RoomForm
