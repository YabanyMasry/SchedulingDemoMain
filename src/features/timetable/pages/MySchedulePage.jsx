import { useQuery } from '@tanstack/react-query'
import api from '../../../services/api'

// Must match the backend's SchoolDays (Sunday–Thursday school week).
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']

// Published-timetable view scoped to the logged-in teacher (their lessons) or
// student (their class's lessons). Backend filters by identity — see GET /timetable/my.
const useMyScheduleQuery = () =>
  useQuery({
    queryKey: ['my-schedule'],
    queryFn: () => api.get('/timetable/my').then((r) => r.data),
  })

const MySchedulePage = () => {
  const schedule = useMyScheduleQuery()

  if (schedule.isLoading) {
    return (
      <section className="page-card">
        <h1>My Schedule</h1>
        <p>Loading your schedule…</p>
      </section>
    )
  }

  if (schedule.isError) {
    return (
      <section className="page-card">
        <h1>My Schedule</h1>
        <p>Could not load your schedule. Please try again later.</p>
      </section>
    )
  }

  const slots = schedule.data ?? []

  if (slots.length === 0) {
    return (
      <section className="page-card">
        <h1>My Schedule</h1>
        <p>No published schedule yet. Check back once a timetable is published.</p>
      </section>
    )
  }

  // Render the full 1..max range so free periods show as empty rows. The personal view
  // has no access to the periods endpoint, so the range is inferred from the slots.
  const maxPeriod = Math.max(...slots.map((s) => s.periodNumber ?? 0))
  const periodNumbers = Array.from({ length: maxPeriod }, (_, i) => i + 1)

  const slotsByDayPeriod = new Map()
  for (const slot of slots) {
    slotsByDayPeriod.set(`${slot.dayOfWeek}|${slot.periodNumber}`, slot)
  }

  return (
    <section className="page-card">
      <h1>My Schedule</h1>
      <p>Your lessons from the currently published timetable.</p>

      <div style={{ overflowX: 'auto' }}>
        <table className="my-schedule-grid" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Period</th>
              {DAYS.map((day) => (
                <th key={day} style={{ padding: '0.5rem', textAlign: 'left' }}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periodNumbers.map((period) => (
              <tr key={period}>
                <td style={{ padding: '0.5rem', fontWeight: 600 }}>{period}</td>
                {DAYS.map((day) => {
                  const slot = slotsByDayPeriod.get(`${day}|${period}`)
                  return (
                    <td
                      key={day}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid rgba(128,128,128,0.25)',
                        verticalAlign: 'top',
                      }}
                    >
                      {slot ? (
                        <>
                          <strong>{slot.subjectNames.join(', ') || '—'}</strong>
                          <div>{slot.classNames.join(', ')}</div>
                          <div>{slot.roomNames.join(', ')}</div>
                        </>
                      ) : null}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default MySchedulePage
