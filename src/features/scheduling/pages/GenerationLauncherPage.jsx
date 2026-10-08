import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconBolt } from '@tabler/icons-react'
import { useTimetablesQuery } from '../../timetable/api/hooks'
import { useStartGenerationMutation, useOptimiseTimetableMutation } from '../api/hooks'

const ALGORITHMS = [
  { value: 'Greedy', label: 'Greedy (fast first-fit)', kind: 'build' },
  { value: 'Csp', label: 'CSP backtracking (thorough)', kind: 'build' },
  { value: 'SimulatedAnnealing', label: 'Simulated Annealing (optimise existing)', kind: 'optimise' },
]

const GenerationLauncherPage = () => {
  const navigate = useNavigate()
  const { data: timetables } = useTimetablesQuery()
  const start = useStartGenerationMutation()
  const optimise = useOptimiseTimetableMutation()

  const [timetableId, setTimetableId] = useState('')
  const [algorithm, setAlgorithm] = useState('Greedy')
  const [maxDurationMs, setMaxDurationMs] = useState(30000)
  const [randomSeed, setRandomSeed] = useState('')
  const [clearExisting, setClearExisting] = useState(true)
  const [error, setError] = useState(null)

  const algo = ALGORITHMS.find((a) => a.value === algorithm)
  const isOptimise = algo?.kind === 'optimise'
  const pending = start.isPending || optimise.isPending

  const submit = async () => {
    setError(null)
    const seed = randomSeed === '' ? null : Number(randomSeed)
    try {
      let result
      if (isOptimise) {
        result = await optimise.mutateAsync({ timetableId, maxDurationMs, randomSeed: seed })
      } else {
        result = await start.mutateAsync({
          timetableId, algorithm, maxDurationMs, randomSeed: seed, clearExisting,
        })
      }
      // Open the live progress view on the new run; it streams progress over SignalR.
      if (result?.runId) navigate(`/scheduling/runs/${result.runId}`)
      else navigate(`/scheduling?timetableId=${timetableId}`)
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Failed to start the run.')
    }
  }

  return (
    <div className="app-content">
      <div className="card-title-row">
        <div>
          <h1 className="card-title" style={{ fontSize: 28, fontWeight: 800 }}>Generate Schedule</h1>
          <p className="card-subtitle">Run an algorithm to build or optimise a timetable.</p>
        </div>
      </div>

      <div style={form}>
        <label style={label}>Timetable
          <select style={input} value={timetableId} onChange={(e) => setTimetableId(e.target.value)}>
            <option value="">Select a timetable…</option>
            {(timetables ?? []).map((t) => <option key={t.id} value={t.id}>{t.name} · {t.status}</option>)}
          </select>
        </label>

        <label style={label}>Algorithm
          <select style={input} value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
            {ALGORITHMS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
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

        {!isOptimise && (
          <label style={{ ...label, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={clearExisting} onChange={(e) => setClearExisting(e.target.checked)} />
            Clear existing non-locked placements first
          </label>
        )}

        {isOptimise && (
          <p style={{ fontSize: 13, color: 'var(--text-soft, #666)' }}>
            Optimise rearranges the timetable's non-locked placements to improve quality; locked lessons stay put.
          </p>
        )}

        {error && <p style={{ color: 'crimson', fontSize: 13 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="pill-button" disabled={!timetableId || pending}
            onClick={submit} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <IconBolt size={16} /> {pending ? 'Starting…' : isOptimise ? 'Optimise' : 'Generate'}
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

export default GenerationLauncherPage
