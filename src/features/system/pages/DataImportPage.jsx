import { useRef, useState } from 'react'
import {
  IconFileTypeXml,
  IconCsv,
  IconUpload,
  IconFile,
  IconCloudUpload,
  IconDownload,
} from '@tabler/icons-react'
import { useImportCsvMutation } from '../api/hooks'
import './DataImportPage.css'

// Each CSV source maps to a backend resource-import target. `columns` are the accepted CSV
// headers (order-independent, case-insensitive); `required` are the ones a row must supply.
// UNTIS XML has no backend yet, so it is flagged unsupported and never uploaded.
const SOURCES = [
  {
    id: 'untis',
    type: null,
    supported: false,
    label: 'UNTIS Export',
    description: 'Full timetable XML export from Untis — not yet supported, use the CSV imports below',
    badge: 'xml',
    icon: <IconFileTypeXml size={20} />,
    accept: '.xml',
  },
  {
    id: 'teachers',
    type: 'teachers',
    supported: true,
    label: 'Teachers CSV',
    description: 'Staff roster — provisions a login for each teacher (Email required)',
    badge: 'csv',
    icon: <IconCsv size={20} />,
    accept: '.csv',
    columns: ['FirstName', 'LastName', 'Email', 'Department', 'PersonnelNumber', 'Title', 'PhoneNumber', 'MobileNumber', 'HomeRoom', 'WeeklyQuota', 'Gender', 'DateOfBirth'],
    required: ['FirstName', 'Email'],
  },
  {
    id: 'students',
    type: 'students',
    supported: true,
    label: 'Students CSV',
    description: 'Student list with class assignment (Email required for login)',
    badge: 'csv',
    icon: <IconCsv size={20} />,
    accept: '.csv',
    columns: ['Name', 'StudentNumber', 'Email', 'Class', 'FullName', 'FirstName', 'Gender', 'DateOfBirth'],
    required: ['Name', 'StudentNumber', 'Email'],
  },
  {
    id: 'classes',
    type: 'classes',
    supported: true,
    label: 'Classes CSV',
    description: 'Class groups with year levels and departments',
    badge: 'csv',
    icon: <IconCsv size={20} />,
    accept: '.csv',
    columns: ['Name', 'YearLevel', 'Department', 'FullName', 'HomeRoom', 'MaleStudents', 'FemaleStudents', 'MaxPeriodsPerDay'],
    required: ['Name', 'YearLevel'],
  },
  {
    id: 'subjects',
    type: 'subjects',
    supported: true,
    label: 'Subjects CSV',
    description: 'Subject catalogue with periods-per-week and department links',
    badge: 'csv',
    icon: <IconCsv size={20} />,
    accept: '.csv',
    columns: ['Code', 'Name', 'Department', 'Category', 'RequiredRoomType', 'MinPeriodsPerWeek', 'MaxPeriodsPerWeek'],
    required: ['Code', 'Name'],
  },
  {
    id: 'rooms',
    type: 'rooms',
    supported: true,
    label: 'Rooms CSV',
    description: 'Room inventory with capacities, types, and building locations',
    badge: 'csv',
    icon: <IconCsv size={20} />,
    accept: '.csv',
    columns: ['RoomNumber', 'Name', 'Capacity', 'RoomType', 'Building', 'Floor', 'Facilities'],
    required: ['RoomNumber', 'Name', 'Capacity'],
  },
]

const downloadTemplate = (source) => {
  const csv = `${source.columns.join(',')}\n`
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${source.id}-template.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const StatusBadge = ({ status, error }) => (
  <span className={`di-status ${status}`} title={error ?? undefined}>
    <span className="di-status-dot" />
    {status.charAt(0).toUpperCase() + status.slice(1)}
    {error && ' ⚠'}
  </span>
)

const RecordsCell = ({ imported, total, status }) => {
  if (status === 'pending' || status === 'processing') return <span className="di-records partial">…</span>
  if (status === 'failed') return <span className="di-records partial">0 / {total.toLocaleString()}</span>
  return <span className="di-records">{imported.toLocaleString()} / {total.toLocaleString()}</span>
}

const SourceCard = ({ source, onFile }) => {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)
  const disabled = !source.supported

  const pick = () => { if (!disabled) inputRef.current?.click() }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) onFile(source.id, file)
  }

  return (
    <div className={`di-source-card${dragging ? ' is-dragging-over' : ''}${disabled ? ' is-disabled' : ''}`}>
      <div
        className="di-source-dropzone"
        onDragOver={(e) => { if (!disabled) { e.preventDefault(); setDragging(true) } }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={pick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => e.key === 'Enter' && pick()}
        aria-label={`Upload ${source.label}`}
        aria-disabled={disabled}
      >
        <input
          ref={inputRef}
          type="file"
          accept={source.accept}
          className="di-file-input"
          disabled={disabled}
          onChange={(e) => { const f = e.target.files[0]; if (f) onFile(source.id, f); e.target.value = '' }}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="di-source-icon">{source.icon}</div>
        <div className="di-source-info">
          <h3>{source.label}</h3>
          <p>{source.description}</p>
        </div>
        <span className={`di-source-badge ${source.badge}`}>{source.badge.toUpperCase()}</span>
        <p className="di-source-hint">
          {disabled ? (
            'Coming soon'
          ) : (
            <>
              <IconUpload size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Click or drag &amp; drop
            </>
          )}
        </p>
      </div>

      {source.supported && (
        <div className="di-source-footer">
          <span className="di-required" title={`Columns: ${source.columns.join(', ')}`}>
            Required: {source.required.join(', ')}
          </span>
          <button type="button" className="di-template-btn" onClick={() => downloadTemplate(source)}>
            <IconDownload size={12} /> Template
          </button>
        </div>
      )}
    </div>
  )
}

const DataImportPage = () => {
  const [jobs, setJobs] = useState([])
  const importCsv = useImportCsvMutation()

  const patchJob = (id, patch) =>
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)))

  const handleFile = async (sourceId, file) => {
    const source = SOURCES.find((s) => s.id === sourceId)
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setJobs((prev) => [{
      id,
      file: file.name,
      type: source.label,
      status: 'processing',
      imported: 0,
      total: 0,
      errors: [],
      error: null,
      at: new Date().toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' }),
    }, ...prev])

    try {
      const result = await importCsv.mutateAsync({ resourceType: source.type, file })
      patchJob(id, {
        status: result.failed > 0 && result.imported === 0 ? 'failed' : 'completed',
        imported: result.imported ?? 0,
        total: result.total ?? 0,
        errors: result.errors ?? [],
        error: result.failed > 0 ? `${result.failed} row${result.failed === 1 ? '' : 's'} failed` : null,
      })
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Upload failed'
      patchJob(id, { status: 'failed', error: msg })
    }
  }

  return (
    <div className="page-card di-page">
      <div>
        <h1>Data Import</h1>
        <p>Upload teachers, students, classes, subjects, and rooms from CSV files. Each upload imports rows independently and reports exactly which rows failed.</p>
      </div>

      <div className="di-note">
        References are matched by name — a teacher/class/subject row&apos;s <strong>Department</strong>, and a
        student row&apos;s <strong>Class</strong>, must already exist. Teachers and students need an
        <strong> Email</strong> (a login is provisioned for each). Download a template on any card for the exact columns.
      </div>

      <section>
        <h2 className="di-section-title">Import Sources</h2>
        <div className="di-sources">
          {SOURCES.map((s) => (
            <SourceCard key={s.id} source={s} onFile={handleFile} />
          ))}
        </div>
      </section>

      <section className="di-jobs-card">
        <div className="di-jobs-header">
          <h2 className="di-section-title">Recent Import Jobs</h2>
          {jobs.length > 0 && (
            <button className="di-clear-btn" onClick={() => setJobs([])}>
              Clear history
            </button>
          )}
        </div>

        {jobs.length === 0 ? (
          <div className="di-empty">
            <IconCloudUpload size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p>No imports yet. Upload a file above to get started.</p>
          </div>
        ) : (
          <table className="di-jobs-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Type</th>
                <th>Status</th>
                <th>Imported</th>
                <th>Imported At</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <div className="di-file-cell">
                      <IconFile size={14} />
                      {job.file}
                    </div>
                    {job.errors?.length > 0 && (
                      <details className="di-errors">
                        <summary>{job.errors.length} row error{job.errors.length === 1 ? '' : 's'}</summary>
                        <ul>
                          {job.errors.slice(0, 50).map((e, idx) => (
                            <li key={idx}>Row {e.row ?? e.Row}: {e.message ?? e.Message}</li>
                          ))}
                          {job.errors.length > 50 && <li>… and {job.errors.length - 50} more</li>}
                        </ul>
                      </details>
                    )}
                  </td>
                  <td>{job.type}</td>
                  <td><StatusBadge status={job.status} error={job.error} /></td>
                  <td><RecordsCell imported={job.imported} total={job.total} status={job.status} /></td>
                  <td style={{ color: 'var(--text-soft)' }}>{job.at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

export default DataImportPage
