import { useState } from 'react'
import './PendingApprovalsPage.css'
import { getAuthErrorMessage } from '../../auth/lib/errors'
import {
  useApprovePendingUserMutation,
  usePendingUsersQuery,
  useRejectPendingUserMutation,
} from '../api/hooks'
import { useDepartmentsQuery } from '../../resource-management/departments/api/hooks'
import { useClassesQuery } from '../../resource-management/classes/api/hooks'

const ROLE_TEACHER = 'Teacher'
const ROLE_STUDENT = 'Student'

const NOTIFICATION_OPTIONS = [
  { value: 1, label: 'Email' },
  { value: 2, label: 'SMS' },
  { value: 3, label: 'Both' },
  { value: 4, label: 'Phone' },
]

const emptyTeacher = (name = '') => ({
  firstName: name,
  lastName: '',
  title: '',
  phoneNumber: '',
  mobileNumber: '',
  departmentId: '',
  homeRoom: '',
  weeklyQuota: '',
  status: '',
  gender: '',
  availableForSubstitution: true,
  maxSubstitutionsPerWeek: '',
  substitutionHourlyRate: '',
  substitutionPreferences: '',
  substitutionQualificationNotes: '',
  preferredNotification: 1,
  dateOfBirth: '',
  personnelNumber: '',
})

const emptyStudent = (name = '') => ({
  name,
  fullName: '',
  firstName: '',
  studentNumber: '',
  classId: '',
  gender: '',
  dateOfBirth: '',
  tag: '',
  description: '',
  code: '',
  optimisationCode: '',
})

const trimOrNull = (v) => (v == null || String(v).trim() === '' ? null : String(v).trim())
const numOrNull = (v) => {
  const t = trimOrNull(v)
  if (t == null) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}
const intOrNull = (v) => {
  const n = numOrNull(v)
  return n == null ? null : parseInt(n, 10)
}

const ApprovalModal = ({ user, onClose, onSubmit, isSubmitting }) => {
  const { data: departments = [] } = useDepartmentsQuery()
  const { data: classes = [] } = useClassesQuery()

  const [role, setRole] = useState(ROLE_TEACHER)
  const [teacher, setTeacher] = useState(emptyTeacher(user.name || ''))
  const [student, setStudent] = useState(emptyStudent(user.name || ''))

  const setT = (k) => (e) => setTeacher((s) => ({ ...s, [k]: e.target.value }))
  const setTBool = (k) => (e) => setTeacher((s) => ({ ...s, [k]: e.target.checked }))
  const setS = (k) => (e) => setStudent((s) => ({ ...s, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (role === ROLE_TEACHER) {
      onSubmit({
        role: ROLE_TEACHER,
        teacherFields: {
          firstName: teacher.firstName.trim(),
          lastName: trimOrNull(teacher.lastName),
          title: trimOrNull(teacher.title),
          phoneNumber: trimOrNull(teacher.phoneNumber),
          mobileNumber: trimOrNull(teacher.mobileNumber),
          departmentId: teacher.departmentId || null,
          homeRoom: trimOrNull(teacher.homeRoom),
          weeklyQuota: numOrNull(teacher.weeklyQuota),
          status: trimOrNull(teacher.status),
          gender: trimOrNull(teacher.gender),
          availableForSubstitution: teacher.availableForSubstitution,
          maxSubstitutionsPerWeek: intOrNull(teacher.maxSubstitutionsPerWeek),
          substitutionHourlyRate: numOrNull(teacher.substitutionHourlyRate),
          substitutionPreferences: trimOrNull(teacher.substitutionPreferences),
          substitutionQualificationNotes: trimOrNull(teacher.substitutionQualificationNotes),
          preferredNotification: parseInt(teacher.preferredNotification, 10) || 1,
          dateOfBirth: teacher.dateOfBirth || null,
          personnelNumber: trimOrNull(teacher.personnelNumber),
        },
        studentFields: null,
      })
    } else {
      onSubmit({
        role: ROLE_STUDENT,
        teacherFields: null,
        studentFields: {
          name: student.name.trim(),
          fullName: trimOrNull(student.fullName),
          firstName: trimOrNull(student.firstName),
          studentNumber: student.studentNumber.trim(),
          classId: student.classId || null,
          gender: student.gender === '' ? null : parseInt(student.gender, 10),
          dateOfBirth: student.dateOfBirth || null,
          tag: trimOrNull(student.tag),
          description: trimOrNull(student.description),
          code: trimOrNull(student.code),
          optimisationCode: trimOrNull(student.optimisationCode),
        },
      })
    }
  }

  return (
    <div className="approval-modal-backdrop" onClick={onClose}>
      <form
        className="approval-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <header className="approval-modal-header">
          <h2>Approve {user.email}</h2>
          <button type="button" className="approval-modal-close" onClick={onClose}>×</button>
        </header>

        <div className="approval-modal-body">
          <fieldset className="approval-role-fieldset">
            <legend>Assign role *</legend>
            <label className="approval-role-option">
              <input
                type="radio"
                name="role"
                value={ROLE_TEACHER}
                checked={role === ROLE_TEACHER}
                onChange={() => setRole(ROLE_TEACHER)}
              />
              Teacher
            </label>
            <label className="approval-role-option">
              <input
                type="radio"
                name="role"
                value={ROLE_STUDENT}
                checked={role === ROLE_STUDENT}
                onChange={() => setRole(ROLE_STUDENT)}
              />
              Student
            </label>
          </fieldset>

          {role === ROLE_TEACHER ? (
            <div className="approval-grid">
              <label className="approval-field">
                <span className="approval-label approval-label-required">First Name</span>
                <input className="approval-input" value={teacher.firstName} onChange={setT('firstName')} required maxLength={100} autoFocus />
              </label>
              <label className="approval-field">
                <span className="approval-label">Last Name</span>
                <input className="approval-input" value={teacher.lastName} onChange={setT('lastName')} maxLength={100} />
              </label>
              <label className="approval-field">
                <span className="approval-label">Department</span>
                <select className="approval-input" value={teacher.departmentId} onChange={setT('departmentId')}>
                  <option value="">— None —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </label>
              <label className="approval-field">
                <span className="approval-label">Personnel #</span>
                <input className="approval-input" value={teacher.personnelNumber} onChange={setT('personnelNumber')} maxLength={50} />
              </label>
              <label className="approval-field">
                <span className="approval-label">Title</span>
                <input className="approval-input" value={teacher.title} onChange={setT('title')} maxLength={50} />
              </label>
              <label className="approval-field">
                <span className="approval-label">Phone</span>
                <input className="approval-input" value={teacher.phoneNumber} onChange={setT('phoneNumber')} maxLength={50} />
              </label>
              <label className="approval-field">
                <span className="approval-label">Mobile</span>
                <input className="approval-input" value={teacher.mobileNumber} onChange={setT('mobileNumber')} maxLength={50} />
              </label>
              <label className="approval-field">
                <span className="approval-label">Home Room</span>
                <input className="approval-input" value={teacher.homeRoom} onChange={setT('homeRoom')} maxLength={50} />
              </label>
              <label className="approval-field">
                <span className="approval-label">Weekly Quota</span>
                <input className="approval-input" type="number" min="0" step="0.5" value={teacher.weeklyQuota} onChange={setT('weeklyQuota')} />
              </label>
              <label className="approval-field">
                <span className="approval-label">Gender</span>
                <select className="approval-input" value={teacher.gender} onChange={setT('gender')}>
                  <option value="">— None —</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </label>
              <label className="approval-field">
                <span className="approval-label">Date of Birth</span>
                <input className="approval-input" type="date" value={teacher.dateOfBirth} onChange={setT('dateOfBirth')} />
              </label>
              <label className="approval-field">
                <span className="approval-label">Notification</span>
                <select className="approval-input" value={teacher.preferredNotification} onChange={setT('preferredNotification')}>
                  {NOTIFICATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
              <div className="approval-section">Substitution</div>
              <label className="approval-field approval-col-full approval-checkbox-row">
                <input
                  type="checkbox"
                  checked={teacher.availableForSubstitution}
                  onChange={setTBool('availableForSubstitution')}
                />
                <span>Available for substitution</span>
              </label>
              <label className="approval-field">
                <span className="approval-label">Max Subs / Week</span>
                <input className="approval-input" type="number" min="0" value={teacher.maxSubstitutionsPerWeek} onChange={setT('maxSubstitutionsPerWeek')} />
              </label>
              <label className="approval-field">
                <span className="approval-label">Hourly Rate</span>
                <input className="approval-input" type="number" min="0" step="0.01" value={teacher.substitutionHourlyRate} onChange={setT('substitutionHourlyRate')} />
              </label>
              <label className="approval-field approval-col-full">
                <span className="approval-label">Preferences</span>
                <input className="approval-input" value={teacher.substitutionPreferences} onChange={setT('substitutionPreferences')} maxLength={500} />
              </label>
              <label className="approval-field approval-col-full">
                <span className="approval-label">Qualification Notes</span>
                <input className="approval-input" value={teacher.substitutionQualificationNotes} onChange={setT('substitutionQualificationNotes')} maxLength={500} />
              </label>
            </div>
          ) : (
            <div className="approval-grid">
              <label className="approval-field">
                <span className="approval-label approval-label-required">Name</span>
                <input className="approval-input" value={student.name} onChange={setS('name')} required maxLength={200} autoFocus />
              </label>
              <label className="approval-field">
                <span className="approval-label">Full Name</span>
                <input className="approval-input" value={student.fullName} onChange={setS('fullName')} maxLength={300} />
              </label>
              <label className="approval-field">
                <span className="approval-label">First Name</span>
                <input className="approval-input" value={student.firstName} onChange={setS('firstName')} maxLength={100} />
              </label>
              <label className="approval-field">
                <span className="approval-label approval-label-required">Student #</span>
                <input className="approval-input" value={student.studentNumber} onChange={setS('studentNumber')} required maxLength={50} />
              </label>
              <label className="approval-field">
                <span className="approval-label">Class</span>
                <select className="approval-input" value={student.classId} onChange={setS('classId')}>
                  <option value="">— None —</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="approval-field">
                <span className="approval-label">Gender</span>
                <select className="approval-input" value={student.gender} onChange={setS('gender')}>
                  <option value="">— None —</option>
                  <option value="0">Male</option>
                  <option value="1">Female</option>
                </select>
              </label>
              <label className="approval-field">
                <span className="approval-label">Date of Birth</span>
                <input className="approval-input" type="date" value={student.dateOfBirth} onChange={setS('dateOfBirth')} />
              </label>
              <label className="approval-field">
                <span className="approval-label">Tag</span>
                <input className="approval-input" value={student.tag} onChange={setS('tag')} maxLength={100} />
              </label>
              <label className="approval-field approval-col-full">
                <span className="approval-label">Description</span>
                <input className="approval-input" value={student.description} onChange={setS('description')} maxLength={500} />
              </label>
              <label className="approval-field">
                <span className="approval-label">Code</span>
                <input className="approval-input" value={student.code} onChange={setS('code')} maxLength={50} />
              </label>
              <label className="approval-field">
                <span className="approval-label">Optimisation Code</span>
                <input className="approval-input" value={student.optimisationCode} onChange={setS('optimisationCode')} maxLength={50} />
              </label>
            </div>
          )}

          <p className="approval-hint">
            Only First Name (Teacher) or Name + Student # (Student) are required. The rest can be filled now or edited later. On approve, the {role} record is created, linked to this account, and a 24-hour magic-link email is sent.
          </p>
        </div>

        <footer className="approval-modal-footer">
          <button type="button" className="pill-button pill-button-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="pill-button" disabled={isSubmitting}>
            {isSubmitting ? 'Approving...' : `Approve as ${role}`}
          </button>
        </footer>
      </form>
    </div>
  )
}

const PendingApprovalsPage = () => {
  const [pendingUser, setPendingUser] = useState(null)
  const [activeUserId, setActiveUserId] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const {
    data: pendingUsers = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = usePendingUsersQuery()

  const approveMutation = useApprovePendingUserMutation()
  const rejectMutation = useRejectPendingUserMutation()

  const submitApproval = async (payload) => {
    if (!pendingUser) return
    setFeedback(null)
    setActiveUserId(pendingUser.id)
    try {
      await approveMutation.mutateAsync({ userId: pendingUser.id, payload })
      setFeedback({ type: 'success', message: `Approved ${pendingUser.email} as ${payload.role}.` })
      setPendingUser(null)
    } catch (e) {
      setFeedback({
        type: 'error',
        message: getAuthErrorMessage(e, 'Could not approve this user.'),
      })
    } finally {
      setActiveUserId(null)
    }
  }

  const rejectUser = async (user) => {
    setFeedback(null)
    setActiveUserId(user.id)
    try {
      await rejectMutation.mutateAsync(user.id)
      setFeedback({ type: 'success', message: `Rejected ${user.email}.` })
    } catch (e) {
      setFeedback({
        type: 'error',
        message: getAuthErrorMessage(e, 'Could not reject this user.'),
      })
    } finally {
      setActiveUserId(null)
    }
  }

  return (
    <section className="page-card">
      <h1>Pending User Approvals</h1>
      <p>Pick a role and fill any of the entity fields when approving. The user can then log in via magic link.</p>

      {feedback ? (
        <p
          className={`auth-feedback ${
            feedback.type === 'success'
              ? 'auth-feedback-success'
              : 'auth-feedback-error'
          }`}
          role="status"
        >
          {feedback.message}
        </p>
      ) : null}

      {isLoading ? <p>Loading pending users...</p> : null}

      {isError ? (
        <div>
          <p>{getAuthErrorMessage(error, 'Could not load pending users.')}</p>
          <button
            type="button"
            className="pill-button"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            Retry
          </button>
        </div>
      ) : null}

      {!isLoading && !isError && pendingUsers.length === 0 ? (
        <p>No pending users found.</p>
      ) : null}

      {!isLoading && !isError && pendingUsers.length > 0 ? (
        <table className="data-table" style={{ marginTop: '16px' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th style={{ width: '260px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map((user) => {
              const rowBusy = activeUserId === user.id

              return (
                <tr key={user.id}>
                  <td>{user.name || 'N/A'}</td>
                  <td>{user.email}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="pill-button"
                        disabled={rowBusy}
                        onClick={() => setPendingUser(user)}
                      >
                        Approve...
                      </button>
                      <button
                        type="button"
                        className="pill-button"
                        style={{ background: '#b91c1c', borderColor: '#b91c1c' }}
                        disabled={rowBusy}
                        onClick={() => rejectUser(user)}
                      >
                        {rowBusy ? 'Working...' : 'Reject'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : null}

      {pendingUser ? (
        <ApprovalModal
          user={pendingUser}
          onClose={() => setPendingUser(null)}
          onSubmit={submitApproval}
          isSubmitting={approveMutation.isPending}
        />
      ) : null}
    </section>
  )
}

export default PendingApprovalsPage
