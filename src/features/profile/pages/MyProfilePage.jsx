import { useState } from 'react'
import {
  useMyTeacherProfileQuery,
  useUpdateMyTeacherProfileMutation,
} from '../api/hooks'

const NOTIFICATION_OPTIONS = [
  { value: 1, label: 'Email' },
  { value: 2, label: 'SMS' },
  { value: 3, label: 'Both' },
  { value: 4, label: 'Phone' },
]

const notificationLabel = (value) =>
  NOTIFICATION_OPTIONS.find((o) => o.value === value)?.label ?? '—'

// Read-only facts maintained by the admin; shown for reference only
const ReadOnlyRow = ({ label, value }) => (
  <div className="profile-row">
    <span className="profile-row-label">{label}</span>
    <span className="profile-row-value">{value || '—'}</span>
  </div>
)

const MyProfilePage = () => {
  const profile = useMyTeacherProfileQuery()
  const updateProfile = useUpdateMyTeacherProfileMutation()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    title: '',
    phoneNumber: '',
    mobileNumber: '',
    preferredNotification: 1,
  })

  // Form state is seeded from the loaded profile at the moment editing starts,
  // so the inputs always reflect the latest saved values
  const startEditing = () => {
    setForm({
      title: profile.data?.title ?? '',
      phoneNumber: profile.data?.phoneNumber ?? '',
      mobileNumber: profile.data?.mobileNumber ?? '',
      preferredNotification: profile.data?.preferredNotification ?? 1,
    })
    setEditing(true)
  }

  if (profile.isLoading) {
    return (
      <section className="page-card">
        <h1>My Profile</h1>
        <p>Loading your profile…</p>
      </section>
    )
  }

  if (profile.isError) {
    return (
      <section className="page-card">
        <h1>My Profile</h1>
        <p>
          Your account is not linked to a teacher record yet. Please contact an
          administrator.
        </p>
      </section>
    )
  }

  const t = profile.data

  const handleSubmit = (e) => {
    e.preventDefault()
    updateProfile.mutate(
      {
        title: form.title.trim() || null,
        phoneNumber: form.phoneNumber.trim() || null,
        mobileNumber: form.mobileNumber.trim() || null,
        preferredNotification: parseInt(form.preferredNotification) || 1,
      },
      { onSuccess: () => setEditing(false) },
    )
  }

  return (
    <section className="page-card">
      <h1>My Profile</h1>
      <p>
        Contact details below are yours to keep up to date. Everything else is
        maintained by the school administration.
      </p>

      <h2>Personal Information</h2>
      <ReadOnlyRow label="Name" value={t.displayName || `${t.firstName} ${t.lastName ?? ''}`} />
      <ReadOnlyRow label="Email" value={t.email} />
      <ReadOnlyRow label="Personnel Number" value={t.personnelNumber} />
      <ReadOnlyRow label="Home Room" value={t.homeRoom} />
      <ReadOnlyRow label="Weekly Quota" value={t.weeklyQuota} />

      <h2>Contact Details</h2>
      {editing ? (
        <form onSubmit={handleSubmit} className="profile-edit-form">
          <label>
            Title
            <input
              value={form.title}
              maxLength={50}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </label>
          <label>
            Phone Number
            <input
              value={form.phoneNumber}
              maxLength={30}
              onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
            />
          </label>
          <label>
            Mobile Number
            <input
              value={form.mobileNumber}
              maxLength={30}
              onChange={(e) => setForm((f) => ({ ...f, mobileNumber: e.target.value }))}
            />
          </label>
          <label>
            Preferred Notification
            <select
              value={form.preferredNotification}
              onChange={(e) =>
                setForm((f) => ({ ...f, preferredNotification: parseInt(e.target.value) }))
              }
            >
              {NOTIFICATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          {updateProfile.isError && (
            <p className="profile-error">
              Could not save your changes. Please check the values and try again.
            </p>
          )}

          <div className="profile-actions">
            <button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <ReadOnlyRow label="Title" value={t.title} />
          <ReadOnlyRow label="Phone Number" value={t.phoneNumber} />
          <ReadOnlyRow label="Mobile Number" value={t.mobileNumber} />
          <ReadOnlyRow
            label="Preferred Notification"
            value={notificationLabel(t.preferredNotification)}
          />
          <div className="profile-actions">
            <button type="button" onClick={startEditing}>
              Edit contact details
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export default MyProfilePage
