import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowLeft } from '@tabler/icons-react'
import { useAnalyticsQuery } from '../api/hooks'
import { toIsoDate, fmtDate } from '../lib/constants'

// Admin substitution analytics over a date range: headline metric cards, a disposition breakdown
// bar chart (CSS — no chart dep), and a per-teacher load table. Consumes GET …/analytics, which is
// PII-minimal (teacher names + ids only). Read-only; admin route guard lives in App.jsx.
const daysAgoIso = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toIsoDate(d)
}

const pct = (rate) => `${Math.round((rate ?? 0) * 100)}%`
const money = (v) => `${Number(v ?? 0).toFixed(2)}`
const hours = (v) => Number(v ?? 0).toFixed(1)

const AnalyticsPage = () => {
  const navigate = useNavigate()
  const [from, setFrom] = useState(daysAgoIso(30))
  const [to, setTo] = useState(toIsoDate(new Date()))

  const { data, isLoading, isError } = useAnalyticsQuery({ from, to })

  const dispositions = Object.entries(data?.dispositionBreakdown ?? {})
  const maxDisp = dispositions.reduce((m, [, n]) => Math.max(m, n), 0)
  const perTeacher = data?.perTeacher ?? []

  return (
    <div className="app-content">
      <div className="card-title-row">
        <div>
          <h1 className="card-title" style={{ fontSize: 28, fontWeight: 800 }}>Substitution analytics</h1>
          <p className="card-subtitle">Coverage, load and pay over a date range.</p>
        </div>
        <button type="button" className="pill-button" style={ghost} onClick={() => navigate('/substitutions')}>
          <IconArrowLeft size={16} /> Absences
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '8px 0 16px', flexWrap: 'wrap' }}>
        <label style={lbl}>From <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} style={input} /></label>
        <label style={lbl}>To <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} style={input} /></label>
        {data && <span style={{ fontSize: 13, color: 'var(--text-soft, #888)' }}>{fmtDate(from)} → {fmtDate(to)}</span>}
      </div>

      {isLoading && <p style={{ padding: 12 }}>Loading…</p>}
      {isError && <p style={{ padding: 12, color: 'crimson' }}>Failed to load analytics.</p>}

      {data && (
        <>
          <div style={cardRow}>
            <Metric label="Coverage rate" value={pct(data.coverageRate)}
              sub={`${data.assignedCount}/${data.totalAffectedLessons} lessons`} accent="#16a34a" />
            <Metric label="Pending" value={data.pendingCount} sub="uncovered lessons" accent="#dc2626" />
            <Metric label="Hours worked" value={hours(data.totalHoursWorked)} sub="by substitutes" accent="#1d4ed8" />
            <Metric label="Total pay" value={money(data.totalPay)} sub="substitute pay" accent="#b45309" />
          </div>

          <div style={panel}>
            <div style={panelHead}>Disposition breakdown</div>
            {dispositions.length === 0 ? (
              <p style={muted}>No coverage records in this range.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dispositions.map(([name, n]) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 130, fontSize: 13 }}>{name}</span>
                    <div style={barTrack}>
                      <div style={{ ...barFill, width: maxDisp ? `${(n / maxDisp) * 100}%` : '0%' }} />
                    </div>
                    <span style={{ width: 36, textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{n}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={panel}>
            <div style={panelHead}>Per-teacher load</div>
            {perTeacher.length === 0 ? (
              <p style={muted}>No teacher activity in this range.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={table}>
                  <thead>
                    <tr>{['Teacher', 'Covered as sub', 'Hours', 'Absences'].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {perTeacher.map((t) => (
                      <tr key={t.teacherId}>
                        <td style={td}>{t.teacherName || '—'}</td>
                        <td style={td}>{t.substitutionsAsCover}</td>
                        <td style={td}>{hours(t.hoursWorked)}</td>
                        <td style={td}>{t.absences}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

const Metric = ({ label, value, sub, accent }) => (
  <div style={{ ...metricCard, borderTop: `3px solid ${accent}` }}>
    <div style={{ fontSize: 12, color: 'var(--text-soft, #888)', fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, margin: '4px 0 2px' }}>{value}</div>
    <div style={{ fontSize: 12, color: 'var(--text-soft, #9ca3af)' }}>{sub}</div>
  </div>
)

const ghost = { background: 'var(--surface-2, #eee)', color: 'inherit', display: 'flex', gap: 6, alignItems: 'center' }
const lbl = { fontSize: 13, fontWeight: 600, display: 'inline-flex', gap: 6, alignItems: 'center' }
const input = { padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border, #ccc)', fontSize: 14, background: 'var(--surface, #fff)', color: 'inherit' }
const cardRow = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }
const metricCard = { background: 'var(--surface, #fff)', border: '1px solid var(--border, #eceef2)', borderRadius: 12, padding: 14 }
const panel = { border: '1px solid var(--border, #e5e5e5)', borderRadius: 12, padding: 16, background: 'var(--surface, #fff)', marginBottom: 16 }
const panelHead = { fontSize: 13, fontWeight: 700, marginBottom: 12 }
const muted = { fontSize: 13, color: 'var(--text-soft, #888)', margin: 0 }
const barTrack = { flex: 1, height: 14, background: 'var(--surface-2, #f1f3f5)', borderRadius: 7, overflow: 'hidden' }
const barFill = { height: '100%', background: '#3b82f6', borderRadius: 7 }
const table = { width: '100%', borderCollapse: 'collapse' }
const th = { textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--border, #ddd)', fontSize: 12 }
const td = { padding: '8px 10px', borderBottom: '1px solid var(--border, #eee)', fontSize: 13 }

export default AnalyticsPage
