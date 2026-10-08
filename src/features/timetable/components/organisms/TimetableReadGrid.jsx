import { useMemo } from 'react'
import { IconUsers, IconBooks } from '@tabler/icons-react'
import {
  paletteFor, gCard, gScroll, gTable, gThCell, gThSticky, gThCorner,
  gPeriodCell, gPeriodBadge, gCell, gSlotCard, gMeta, gMetaRoom,
} from '../../lib/grid'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
const cellKey = (day, periodId) => `${day}|${periodId}`

/**
 * Read-only days × periods grid shared by the Compare, Print, Batch-print and My-Schedule views.
 * Styled to match the admin editor grid (shared tokens in ../../lib/grid) so teachers and students
 * see the same timetable look the admin sees after generation — just without the edit controls.
 *
 * When the caller can supply the full `periods` list (admin pages — RM periods endpoint), every
 * non-break period renders as a row even with zero placements, so the week skeleton (5 days × all
 * period numbers) is always visible. Otherwise rows fall back to being derived from the slots
 * themselves (periodId + periodNumber) — the personal `/my` path, where the caller has no access to
 * the periods endpoint.
 */
const TimetableReadGrid = ({ slots = [], periods: allPeriods, emptyText = 'No placements.' }) => {
  const periods = useMemo(() => {
    if (allPeriods?.length) {
      return [...allPeriods]
        .filter((p) => !p.isBreak)
        .sort((a, b) => (a.periodNumber ?? 0) - (b.periodNumber ?? 0))
        .map((p) => ({ id: p.id, number: p.periodNumber ?? 0 }))
    }
    const map = new Map()
    for (const s of slots) {
      if (!map.has(s.periodId)) map.set(s.periodId, s.periodNumber ?? 0)
    }
    return [...map.entries()]
      .map(([id, number]) => ({ id, number }))
      .sort((a, b) => a.number - b.number)
  }, [allPeriods, slots])

  const byCell = useMemo(() => {
    const map = new Map()
    for (const s of slots) {
      const k = cellKey(s.dayOfWeek, s.periodId)
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(s)
    }
    return map
  }, [slots])

  if (periods.length === 0) return <p style={{ padding: 12, color: 'var(--text-soft, #888)' }}>{emptyText}</p>

  return (
    <div style={gCard}>
      <div style={gScroll}>
        <table style={gTable}>
          <thead>
            <tr>
              <th style={{ ...gThCell, ...gThCorner, width: 64 }}>Period</th>
              {DAYS.map((d) => <th key={d} style={{ ...gThCell, ...gThSticky }}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.id}>
                <td style={gPeriodCell}><span style={gPeriodBadge}>{p.number}</span></td>
                {DAYS.map((day) => (
                  <td key={day} style={gCell}>
                    {(byCell.get(cellKey(day, p.id)) ?? []).map((s) => (
                      <ReadSlotCard key={s.scheduledLessonId} slot={s} />
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const ReadSlotCard = ({ slot }) => {
  const subject = slot.subjectNames?.join(', ') || 'Lesson'
  const pal = paletteFor(subject)
  return (
    <div style={{ ...gSlotCard, background: pal.bg, borderLeft: `3px solid ${pal.edge}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: pal.text, flex: 1, minWidth: 0 }}>{subject}</span>
        {slot.teacherNames?.length > 1 && (
          <span title="Co-teaching" style={{ display: 'inline-flex', flexShrink: 0 }}>
            <IconUsers size={12} style={{ color: '#1e40af' }} />
          </span>
        )}
        {slot.subjectNames?.length > 1 && (
          <span title="Multi-subject" style={{ display: 'inline-flex', flexShrink: 0 }}>
            <IconBooks size={12} style={{ color: '#5b21b6' }} />
          </span>
        )}
      </div>
      {slot.teacherNames?.length > 0 && <div style={gMeta}>{slot.teacherNames.join(', ')}</div>}
      {slot.classNames?.length > 0 && <div style={gMeta}>{slot.classNames.join(', ')}</div>}
      {slot.roomNames?.length > 0 && <div style={gMetaRoom}>📍 {slot.roomNames.join(', ')}</div>}
    </div>
  )
}

export default TimetableReadGrid
