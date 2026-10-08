import { createPortal } from 'react-dom'
import { useState, useMemo } from 'react'
import {
  IconDatabaseExport,
  IconDownload,
  IconRefresh,
  IconTrash,
  IconDatabase,
  IconClockHour4,
} from '@tabler/icons-react'
import './BackupPage.css'

const RestoreConfirm = ({ snapshot, onConfirm, onCancel }) =>
  createPortal(
    <div className="bp-confirm-overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="bp-confirm-modal" role="dialog" aria-modal="true">
        <h3>Restore this backup?</h3>
        <p>
          <strong>{snapshot.name}</strong> will replace the current database. This action cannot be undone.
          All changes made after <strong>{snapshot.createdAt}</strong> will be lost.
        </p>
        <div className="bp-confirm-actions">
          <button className="bp-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="bp-confirm-restore-btn" onClick={onConfirm}>Yes, restore</button>
        </div>
      </div>
    </div>,
    document.body,
  )

const StatusBadge = ({ status, note }) => {
  const label = status === 'ok' ? 'Verified' : status === 'new' ? 'New' : 'Caution'
  return (
    <span className={`bp-status ${status}`} title={note ?? undefined}>
      <span className="bp-status-dot" />
      {label}
    </span>
  )
}

const BackupPage = () => {
  const [snapshots, setSnapshots] = useState([])
  const [creating, setCreating] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return snapshots
    return snapshots.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.createdBy.toLowerCase().includes(q) ||
        s.createdAt.includes(q),
    )
  }, [snapshots, search])

  const handleCreate = () => {
    setCreating(true)
    setTimeout(() => {
      const now = new Date()
      const pad = (n) => String(n).padStart(2, '0')
      const name = `backup_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}.db`
      setSnapshots((prev) => [
        { id: Date.now(), name, size: '18.5 MB', createdAt: now.toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' }), createdBy: 'Admin', status: 'new' },
        ...prev,
      ])
      setCreating(false)
    }, 2000)
  }

  const handleDelete = (id) =>
    setSnapshots((prev) => prev.filter((s) => s.id !== id))

  const handleRestoreConfirm = () => {
    setRestoreTarget(null)
    // Real implementation would POST /system/backups/{id}/restore
  }

  const totalSize = snapshots.reduce((acc, s) => acc + parseFloat(s.size), 0).toFixed(1)

  return (
    <div className="page-card bp-page">
      {restoreTarget && (
        <RestoreConfirm
          snapshot={restoreTarget}
          onConfirm={handleRestoreConfirm}
          onCancel={() => setRestoreTarget(null)}
        />
      )}

      <div>
        <h1>Backup &amp; Restore</h1>
        <p>Create and manage database snapshots. Automatic backups run nightly at 02:00.</p>
      </div>

      <div className="bp-note">
        <strong>Mockup only</strong> — snapshot creation and restore are simulated. Real backup endpoints are not yet wired.
      </div>

      {/* Stats */}
      <div className="bp-stats">
        <div className="bp-stat">
          <p className="bp-stat-label">Total Snapshots</p>
          <p className="bp-stat-value orange">{snapshots.length}</p>
        </div>
        <div className="bp-stat">
          <p className="bp-stat-label">Storage Used</p>
          <p className="bp-stat-value">{totalSize} MB</p>
        </div>
        <div className="bp-stat">
          <p className="bp-stat-label">Latest Backup</p>
          <p className="bp-stat-value" style={{ fontSize: 15, paddingTop: 4 }}>
            {snapshots[0]?.createdAt ?? '—'}
          </p>
        </div>
        <div className="bp-stat">
          <p className="bp-stat-label">Auto Schedule</p>
          <p className="bp-stat-value" style={{ fontSize: 15, paddingTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconClockHour4 size={16} style={{ color: 'var(--brand)' }} />
            Daily 02:00
          </p>
        </div>
      </div>

      {/* Action row */}
      <div className="bp-action-row">
        <button className="bp-create-btn" onClick={handleCreate} disabled={creating}>
          <IconDatabaseExport size={16} />
          {creating ? 'Creating…' : 'Create Snapshot Now'}
        </button>
        {creating && (
          <span className="bp-creating-msg">
            <span className="bp-spinner" />
            Snapshotting database…
          </span>
        )}
      </div>

      {/* Snapshots table */}
      <section className="bp-table-card">
        <div className="bp-table-header">
          <h2 className="bp-section-title">Snapshots</h2>
          <input
            className="bp-search"
            placeholder="Search snapshots…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="bp-empty">
            <IconDatabase size={32} style={{ opacity: 0.25, marginBottom: 8 }} />
            <p>{search ? 'No snapshots match your search.' : 'No snapshots yet. Create one above.'}</p>
          </div>
        ) : (
          <table className="bp-table">
            <thead>
              <tr>
                <th>Snapshot</th>
                <th>Size</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Created By</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((snap) => (
                <tr key={snap.id}>
                  <td>
                    <div className="bp-name-cell">
                      <IconDatabase size={14} />
                      {snap.name}
                    </div>
                  </td>
                  <td><span className="bp-size">{snap.size}</span></td>
                  <td><StatusBadge status={snap.status} note={snap.note} /></td>
                  <td style={{ color: 'var(--text-soft)' }}>{snap.createdAt}</td>
                  <td style={{ color: 'var(--text-soft)' }}>{snap.createdBy}</td>
                  <td>
                    <div className="bp-row-actions">
                      <button className="bp-action-btn download" title="Download snapshot">
                        <IconDownload size={13} />
                        Download
                      </button>
                      <button
                        className="bp-action-btn restore"
                        title="Restore to this snapshot"
                        onClick={() => setRestoreTarget(snap)}
                      >
                        <IconRefresh size={13} />
                        Restore
                      </button>
                      <button
                        className="bp-action-btn danger"
                        title="Delete snapshot"
                        onClick={() => handleDelete(snap.id)}
                      >
                        <IconTrash size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

export default BackupPage
