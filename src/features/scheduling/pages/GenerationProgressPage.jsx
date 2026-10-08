import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IconArrowLeft, IconX } from '@tabler/icons-react'
import { useAuth } from '../../auth/context/useAuth'
import { useGenerationRunQuery, useCancelRunMutation } from '../api/hooks'
import { buildProgressConnection } from '../lib/progressConnection'

const STATUS_COLORS = {
  Running: '#2563eb', Pending: '#6b7280', Completed: '#16a34a', Failed: '#dc2626', Cancelled: '#b45309',
}
const isActive = (s) => s === 'Running' || s === 'Pending'
const isTerminal = (s) => s === 'Completed' || s === 'Failed' || s === 'Cancelled'

const StatusBadge = ({ status }) => (
  <span style={{
    background: (STATUS_COLORS[status] ?? '#6b7280') + '22',
    color: STATUS_COLORS[status] ?? '#6b7280',
    borderRadius: 999, padding: '3px 12px', fontSize: 13, fontWeight: 700,
  }}>{status ?? '—'}</span>
)

const GenerationProgressPage = () => {
  const { runId } = useParams()
  const navigate = useNavigate()
  const { tokens } = useAuth()

  // SignalR is the primary channel; the run-status query is the source of truth for terminal
  // state and the fallback when the socket can't connect (poll every 2s while active).
  const [live, setLive] = useState(null) // latest pushed frame { progressPercent, message, currentBestScore, isComplete, errorMessage }
  const [log, setLog] = useState([]) // message history, newest last
  const [transport, setTransport] = useState('connecting') // connecting | live | polling

  const { data: run, isLoading } = useGenerationRunQuery(runId, { pollWhileActive: true })
  const cancel = useCancelRunMutation()

  // Keep a ref to the freshest access token so accessTokenFactory never reads a stale closure.
  const tokenRef = useRef(tokens?.accessToken)
  useEffect(() => { tokenRef.current = tokens?.accessToken }, [tokens])

  useEffect(() => {
    if (!runId) return
    const connection = buildProgressConnection(() => tokenRef.current)

    connection.on('progress', (frame) => {
      setLive(frame)
      if (frame?.message) {
        setLog((prev) => [...prev.slice(-199), { ts: Date.now(), text: frame.message }])
      }
    })
    connection.onreconnecting(() => setTransport('connecting'))
    connection.onreconnected(() => { setTransport('live'); connection.invoke('JoinRun', runId).catch(() => {}) })

    let cancelled = false
    connection.start()
      .then(() => connection.invoke('JoinRun', runId))
      .then(() => { if (!cancelled) setTransport('live') })
      .catch(() => { if (!cancelled) setTransport('polling') }) // socket unavailable → query polling carries us

    return () => {
      cancelled = true
      connection.stop().catch(() => {})
    }
  }, [runId])

  const status = run?.status
  // Prefer the live frame's percent/score while running; fall back to the persisted row.
  const percent = Math.round(
    (isActive(status) ? live?.progressPercent : run?.progressPercent) ?? run?.progressPercent ?? 0,
  )
  const bestScore = (isActive(status) ? live?.currentBestScore : run?.currentBestScore) ?? run?.currentBestScore
  const errorMessage = run?.errorMessage ?? live?.errorMessage

  return (
    <div className="app-content">
      <div className="card-title-row">
        <div>
          <h1 className="card-title" style={{ fontSize: 28, fontWeight: 800 }}>Generation Progress</h1>
          <p className="card-subtitle">
            {run?.algorithm ? `${run.algorithm} · ` : ''}Run {runId?.slice(0, 8)}
          </p>
        </div>
        <button type="button" className="pill-button" style={ghost}
          onClick={() => navigate('/scheduling')}>
          <IconArrowLeft size={16} style={{ marginRight: 4 }} /> Run history
        </button>
      </div>

      {isLoading && <p style={{ padding: 12 }}>Loading…</p>}

      {!isLoading && (
        <div style={panel}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <StatusBadge status={status} />
            <span style={{ fontSize: 12, color: 'var(--text-soft, #888)' }}>
              {transport === 'live' ? '● live' : transport === 'polling' ? '○ polling' : '… connecting'}
            </span>
          </div>

          <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ fontWeight: 600 }}>Progress</span>
            <span>{percent}%</span>
          </div>
          <div style={track}>
            <div style={{
              ...bar,
              width: `${percent}%`,
              background: STATUS_COLORS[status] ?? '#2563eb',
              transition: 'width .3s ease',
            }} />
          </div>

          <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
            <Stat label="Best score" value={bestScore != null ? bestScore.toFixed(2) : '—'} />
            <Stat label="Started" value={run?.startedAt ? new Date(run.startedAt).toLocaleTimeString() : '—'} />
            <Stat label="Finished" value={run?.finishedAt ? new Date(run.finishedAt).toLocaleTimeString() : '—'} />
          </div>

          {errorMessage && status === 'Failed' && (
            <p style={{ color: '#dc2626', fontSize: 13, marginTop: 16 }}>⚠ {errorMessage}</p>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            {isActive(status) && (
              <button type="button" className="pill-button" style={cancelBtn} disabled={cancel.isPending}
                onClick={() => cancel.mutate(runId)}>
                <IconX size={16} style={{ marginRight: 4 }} /> Cancel run
              </button>
            )}
            {isTerminal(status) && (
              <>
                <button type="button" className="pill-button" onClick={() => navigate('/scheduling/launch')}>
                  New run
                </button>
                {run?.timetableId && (
                  <button type="button" className="pill-button" style={ghost}
                    onClick={() => navigate(`/timetable/${run.timetableId}/edit`)}>
                    View timetable
                  </button>
                )}
              </>
            )}
          </div>

          {log.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Message log</div>
              <div style={logBox}>
                {log.map((entry, i) => (
                  <div key={`${entry.ts}-${i}`} style={logLine}>
                    <span style={{ color: 'var(--text-soft, #999)' }}>
                      {new Date(entry.ts).toLocaleTimeString()}
                    </span>{' '}
                    {entry.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const Stat = ({ label, value }) => (
  <div>
    <div style={{ fontSize: 11, color: 'var(--text-soft, #888)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
  </div>
)

const panel = {
  background: 'var(--surface, #fff)', borderRadius: 14, padding: 24, maxWidth: 640,
  border: '1px solid var(--border, #eceef2)',
  boxShadow: 'var(--shadow-soft, 0px 4px 20px rgba(0,0,0,0.05))',
}
const track = { height: 10, borderRadius: 999, background: '#f1f3f7', overflow: 'hidden' }
const bar = { height: '100%', borderRadius: 999 }
const ghost = { background: 'var(--surface-2, #eee)', color: 'inherit', display: 'inline-flex', alignItems: 'center' }
const cancelBtn = { background: '#fee2e2', color: '#b91c1c', display: 'inline-flex', alignItems: 'center' }
const logBox = { background: 'var(--surface-2, #f6f7fa)', borderRadius: 8, padding: 12, maxHeight: 240, overflowY: 'auto', fontSize: 12, fontFamily: 'ui-monospace, monospace' }
const logLine = { padding: '2px 0', lineHeight: 1.5 }

export default GenerationProgressPage
