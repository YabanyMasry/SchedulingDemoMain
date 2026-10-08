import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconSparkles } from '@tabler/icons-react'
import { useTimetablesQuery } from '../../timetable/api/hooks'
import { useOptimiseTimetableMutation } from '../api/hooks'

// Dedicated entry point for Simulated Annealing (PR 12). Unlike the generic launcher this is
// purpose-built for *polishing* an already-placed timetable: no algorithm picker, no
// clear-existing toggle — SA always rearranges the non-locked placements in place and leaves
// locked lessons untouched.
const OptimiseTimetablePage = () => {
  const navigate = useNavigate()
  const { data: timetables } = useTimetablesQuery()
  const optimise = useOptimiseTimetableMutation()

  const [timetableId, setTimetableId] = useState('')
  const [maxDurationMs, setMaxDurationMs] = useState(30000)
  const [randomSeed, setRandomSeed] = useState('')
  const [error, setError] = useState(null)

  const submit = async () => {
    setError(null)
    const seed = randomSeed === '' ? null : Number(randomSeed)
    try {
      const result = await optimise.mutateAsync({ timetableId, maxDurationMs, randomSeed: seed })
      if (result?.runId) navigate(`/scheduling/runs/${result.runId}`)
      else navigate(`/scheduling?timetableId=${timetableId}`)
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Failed to start optimisation.')
    }
  }

  return (
    <div className="app-content">
      <div className="card-title-row">
        <div>
          <h1 className="card-title" style={{ fontSize: 28, fontWeight: 800 }}>Optimise Timetable</h1>
          <p className="card-subtitle">
            Run Simulated Annealing to improve the quality of an existing schedule.
          </p>
        </div>
      </div>

      <div style={form}>
        <label style={label}>Timetable
          <select style={input} value={timetableId} onChange={(e) => setTimetableId(e.target.value)}>
            <option value="">Select a timetable…</option>
            {(timetables ?? []).map((t) => (
              <option key={t.id} value={t.id}>{t.name} · {t.status}</option>
            ))}
          </select>
        </label>

        <label style={label}>Max duration (ms)
          <input type="number" min={1000} step={1000} style={input}
            value={maxDurationMs} onChange={(e) => setMaxDurationMs(Number(e.target.value))} />
        </label>

        <label style={label}>Random seed (optional)
          <input type="number" style={input} placeholder="leave blank for random"
            value={randomSeed} onChange={(e) => setRandomSeed(e.target.value)} />
        </label>

        <p style={{ fontSize: 13, color: 'var(--text-soft, #666)' }}>
          Optimise rearranges the timetable's non-locked placements to raise its soft-constraint
          quality score without breaking any hard constraint. Locked lessons stay exactly where they are.
        </p>

        {error && <p style={{ color: 'crimson', fontSize: 13 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="pill-button" disabled={!timetableId || optimise.isPending}
            onClick={submit} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <IconSparkles size={16} /> {optimise.isPending ? 'Starting…' : 'Optimise'}
          </button>
          <button type="button" className="pill-button" style={ghost}
            onClick={() => navigate('/scheduling')}>Run history</button>
        </div>
      </div>
    </div>
  )
}

const form = { display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 460 }
const label = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }
const input = { padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #ccc)', fontSize: 14 }
const ghost = { background: 'var(--surface-2, #eee)', color: 'inherit' }

export default OptimiseTimetablePage
