import { useState } from 'react'
import { useTimetablesQuery, useTimetableGridQuery } from '../api/hooks'
import { usePeriodsQuery } from '../../resource-management/periods/api/hooks'
import TimetableReadGrid from '../components/organisms/TimetableReadGrid'

const ComparePane = ({ timetables, periods, side, value, onChange }) => {
  const { data: slots, isLoading, isError } = useTimetableGridQuery(value)
  return (
    <div style={{ flex: 1, minWidth: 320 }}>
      <label style={label}>{side}
        <select style={input} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">Select a timetable…</option>
          {(timetables ?? []).map((t) => (
            <option key={t.id} value={t.id}>{t.name} · {t.status}</option>
          ))}
        </select>
      </label>
      {value && isLoading && <p style={{ padding: 12 }}>Loading…</p>}
      {value && isError && <p style={{ padding: 12, color: 'crimson' }}>Failed to load.</p>}
      {value && !isLoading && !isError && <TimetableReadGrid slots={slots ?? []} periods={periods} />}
    </div>
  )
}

const TimetableComparePage = () => {
  const { data: timetables } = useTimetablesQuery()
  const { data: periods } = usePeriodsQuery()
  const [left, setLeft] = useState(null)
  const [right, setRight] = useState(null)

  return (
    <div className="app-content">
      <div className="card-title-row">
        <div>
          <h1 className="card-title" style={{ fontSize: 28, fontWeight: 800 }}>Compare Timetables</h1>
          <p className="card-subtitle">View two schedules side by side.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <ComparePane timetables={timetables} periods={periods} side="Left" value={left} onChange={setLeft} />
        <ComparePane timetables={timetables} periods={periods} side="Right" value={right} onChange={setRight} />
      </div>
    </div>
  )
}

const label = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600, marginBottom: 12 }
const input = { padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #ccc)', fontSize: 14 }

export default TimetableComparePage
