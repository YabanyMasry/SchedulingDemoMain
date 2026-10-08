import { useMemo, useState } from 'react'
import { useStudentsQuery } from '../../resource-management/students/api/hooks'
import { useClassesQuery } from '../../resource-management/classes/api/hooks'
import { useTeachersQuery } from '../../resource-management/teachers/api/hooks'
import './DashboardPage.css'

const teacherName = (t) =>
  t.fullName || `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim() || t.email || '—'

const DashboardPage = () => {
  const students = useStudentsQuery()
  const classes = useClassesQuery()
  const teachers = useTeachersQuery()
  const [search, setSearch] = useState('')

  const studentCount = students.data?.length ?? 0
  const activeClassCount = (classes.data ?? []).filter((c) => c.isActive).length
  const teacherCount = teachers.data?.length ?? 0

  // Directory is the live teacher roster, filtered client-side.
  const directory = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = (teachers.data ?? []).map((t) => ({
      id: t.id,
      name: teacherName(t),
      email: t.email || '—',
      status: t.isActive ? 'Active' : 'Inactive',
    }))
    if (!q) return rows
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))
  }, [teachers.data, search])

  const tile = (label, value, loading) => (
    <article className="metric-tile">
      <span className="metric-icon">{label.slice(0, 2).toUpperCase()}</span>
      <div>
        <p className="metric-label">{label}</p>
        <p className="metric-value">{loading ? '…' : value.toLocaleString()}</p>
      </div>
    </article>
  )

  return (
    <section className="page-card">
      <h1>Dashboard</h1>
      <p>Central hub for scheduling operations and daily monitoring.</p>

      <div className="dashboard-top">
        {tile('Total Students', studentCount, students.isLoading)}
        {tile('Active Classes', activeClassCount, classes.isLoading)}
        {tile('Teachers', teacherCount, teachers.isLoading)}
      </div>

      <article className="page-card">
        <div className="card-title-row">
          <div>
            <h2 className="card-title">Directory</h2>
            <p className="card-subtitle">Quick roster access</p>
          </div>
        </div>

        <div className="search-row">
          <input
            className="pill-input"
            type="search"
            placeholder="Search teacher by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {teachers.isLoading ? (
          <p style={{ color: 'var(--text-soft)', padding: '8px 0' }}>Loading…</p>
        ) : teachers.isError ? (
          <p style={{ color: '#ef4444', padding: '8px 0' }}>Failed to load teachers.</p>
        ) : directory.length === 0 ? (
          <p style={{ color: 'var(--text-soft)', padding: '8px 0' }}>
            {search ? 'No teachers match your search.' : 'No teachers yet.'}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {directory.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    </section>
  )
}

export default DashboardPage
