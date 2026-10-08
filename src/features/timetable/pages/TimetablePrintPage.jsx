import { useState } from 'react'
import { IconPrinter } from '@tabler/icons-react'
import { useAuth } from '../../auth/context/useAuth'
import { useTimetablesQuery, useTimetableGridQuery, useMyTimetableQuery } from '../api/hooks'
import { usePeriodsQuery } from '../../resource-management/periods/api/hooks'
import TimetableReadGrid from '../components/organisms/TimetableReadGrid'

const isAdmin = (user) => (user?.role ?? '').toLowerCase() === 'admin'

// Admin: pick any timetable and print its full grid.
const AdminPrint = () => {
  const { data: timetables } = useTimetablesQuery()
  const { data: periods } = usePeriodsQuery()
  const [selected, setSelected] = useState(null)
  const { data: slots, isLoading } = useTimetableGridQuery(selected)
  const chosen = (timetables ?? []).find((t) => t.id === selected)

  return (
    <>
      <div className="no-print" style={controls}>
        <select style={input} value={selected ?? ''} onChange={(e) => setSelected(e.target.value || null)}>
          <option value="">Select a timetable…</option>
          {(timetables ?? []).map((t) => <option key={t.id} value={t.id}>{t.name} · {t.status}</option>)}
        </select>
        <button type="button" className="pill-button" disabled={!selected}
          onClick={() => window.print()} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <IconPrinter size={16} /> Print
        </button>
      </div>
      {selected && (
        <div>
          <h2 style={{ fontSize: 18 }}>{chosen?.name}</h2>
          {isLoading ? <p>Loading…</p> : <TimetableReadGrid slots={slots ?? []} periods={periods} />}
        </div>
      )}
    </>
  )
}

// Teacher / student: print own published timetable.
const MyPrint = () => {
  const { data: slots, isLoading, isError } = useMyTimetableQuery()
  return (
    <>
      <div className="no-print" style={controls}>
        <button type="button" className="pill-button"
          onClick={() => window.print()} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <IconPrinter size={16} /> Print
        </button>
      </div>
      {isLoading && <p>Loading…</p>}
      {isError && <p style={{ color: 'crimson' }}>No published timetable available.</p>}
      {!isLoading && !isError && <TimetableReadGrid slots={slots ?? []} emptyText="You have no scheduled lessons yet." />}
    </>
  )
}

const TimetablePrintPage = () => {
  const { user } = useAuth()
  return (
    <div className="app-content">
      <style>{'@media print { .no-print { display: none !important; } .app-sidebar, nav, header { display: none !important; } }'}</style>
      <div className="card-title-row no-print">
        <div>
          <h1 className="card-title" style={{ fontSize: 28, fontWeight: 800 }}>Print Timetable</h1>
          <p className="card-subtitle">Generate a printable schedule view.</p>
        </div>
      </div>
      {isAdmin(user) ? <AdminPrint /> : <MyPrint />}
    </div>
  )
}

const controls = { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }
const input = { padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #ccc)', fontSize: 14, minWidth: 240 }

export default TimetablePrintPage
