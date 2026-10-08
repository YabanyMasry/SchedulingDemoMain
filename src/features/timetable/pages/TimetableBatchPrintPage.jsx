import { useMemo, useState } from 'react'
import { IconPrinter } from '@tabler/icons-react'
import { useTimetablesQuery, useTimetableGridQuery } from '../api/hooks'
import { usePeriodsQuery } from '../../resource-management/periods/api/hooks'
import TimetableReadGrid from '../components/organisms/TimetableReadGrid'

// Which name array on a slot defines a print section.
const DIMENSIONS = {
  class: { label: 'Class', field: 'classNames' },
  teacher: { label: 'Teacher', field: 'teacherNames' },
  room: { label: 'Room', field: 'roomNames' },
}

// A slot belongs to every entity it names on the chosen dimension (a lesson can have several).
const groupByDimension = (slots, field) => {
  const groups = new Map()
  for (const s of slots) {
    const names = s[field] ?? []
    if (names.length === 0) {
      const k = '— Unassigned —'
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k).push(s)
    }
    for (const name of names) {
      if (!groups.has(name)) groups.set(name, [])
      groups.get(name).push(s)
    }
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

const TimetableBatchPrintPage = () => {
  const { data: timetables } = useTimetablesQuery()
  const { data: periods } = usePeriodsQuery()
  const [selected, setSelected] = useState(null)
  const [dimension, setDimension] = useState('class')
  const { data: slots, isLoading } = useTimetableGridQuery(selected)

  const groups = useMemo(
    () => groupByDimension(slots ?? [], DIMENSIONS[dimension].field),
    [slots, dimension],
  )

  return (
    <div className="app-content">
      <style>{'@media print { .no-print { display: none !important; } .app-sidebar, nav, header { display: none !important; } .batch-section { page-break-after: always; } }'}</style>

      <div className="card-title-row no-print">
        <div>
          <h1 className="card-title" style={{ fontSize: 28, fontWeight: 800 }}>Batch Print</h1>
          <p className="card-subtitle">Print one schedule per class, teacher, or room.</p>
        </div>
      </div>

      <div className="no-print" style={controls}>
        <select style={input} value={selected ?? ''} onChange={(e) => setSelected(e.target.value || null)}>
          <option value="">Select a timetable…</option>
          {(timetables ?? []).map((t) => <option key={t.id} value={t.id}>{t.name} · {t.status}</option>)}
        </select>
        <select style={input} value={dimension} onChange={(e) => setDimension(e.target.value)}>
          {Object.entries(DIMENSIONS).map(([k, v]) => <option key={k} value={k}>Per {v.label}</option>)}
        </select>
        <button type="button" className="pill-button" disabled={!selected || groups.length === 0}
          onClick={() => window.print()} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <IconPrinter size={16} /> Print {groups.length > 0 ? `(${groups.length})` : ''}
        </button>
      </div>

      {selected && isLoading && <p>Loading…</p>}
      {selected && !isLoading && groups.length === 0 && <p style={{ color: 'var(--text-soft, #888)' }}>No placements to print.</p>}

      {groups.map(([name, sectionSlots]) => (
        <section key={name} className="batch-section" style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18 }}>{DIMENSIONS[dimension].label}: {name}</h2>
          <TimetableReadGrid slots={sectionSlots} periods={periods} />
        </section>
      ))}
    </div>
  )
}

const controls = { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }
const input = { padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #ccc)', fontSize: 14, minWidth: 200 }

export default TimetableBatchPrintPage
