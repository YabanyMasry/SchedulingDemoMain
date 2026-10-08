import { createPortal } from 'react-dom'
import { useMemo, useState } from 'react'
import { IconPlus, IconPencil, IconTrash } from '@tabler/icons-react'
import {
  useSchoolYearsQuery,
  useTermsQuery,
  useCreateSchoolYearMutation,
  useUpdateSchoolYearMutation,
  useDeleteSchoolYearMutation,
  useCreateTermMutation,
  useUpdateTermMutation,
  useDeleteTermMutation,
} from '../api/hooks'
import SchoolYearForm from '../components/SchoolYearForm'
import TermForm from '../components/TermForm'

const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

const iconBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text-soft)',
  padding: 2,
}

// Confirmation dialog for the (irreversible) delete actions. Surfaces a server-side
// conflict message — e.g. a school year that still owns timetables — inline.
const ConfirmDelete = ({ title, body, error, isPending, onConfirm, onCancel }) =>
  createPortal(
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div style={{ background: 'var(--surface, #fff)', borderRadius: 12, padding: 20, width: 'min(420px, 92vw)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }} role="dialog" aria-modal="true">
        <h3 style={{ margin: '0 0 8px' }}>{title}</h3>
        <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-soft)' }}>{body}</p>
        {error && <p style={{ margin: '0 0 12px', fontSize: 13, color: 'crimson' }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="pill-button" style={{ background: 'var(--surface-2, #eee)', color: 'inherit' }} onClick={onCancel}>Cancel</button>
          <button type="button" className="pill-button" style={{ background: '#ef4444', color: '#fff' }} disabled={isPending} onClick={onConfirm}>
            {isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )

const SchoolYearsPage = () => {
  const { data: schoolYears, isLoading, isError } = useSchoolYearsQuery()
  const { data: terms } = useTermsQuery()
  const createYear = useCreateSchoolYearMutation()
  const updateYear = useUpdateSchoolYearMutation()
  const deleteYear = useDeleteSchoolYearMutation()
  const createTerm = useCreateTermMutation()
  const updateTerm = useUpdateTermMutation()
  const deleteTerm = useDeleteTermMutation()

  const [modal, setModal] = useState(null)
  // { kind: 'year' | 'term', entity }
  const [confirm, setConfirm] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  const closeConfirm = () => { setConfirm(null); setDeleteError(null) }

  const handleConfirmDelete = () => {
    setDeleteError(null)
    const { kind, entity } = confirm
    const mutation = kind === 'year' ? deleteYear : deleteTerm
    mutation.mutate(entity.id, {
      onSuccess: closeConfirm,
      onError: (err) =>
        setDeleteError(err?.response?.data?.error ?? 'Delete failed. Please try again.'),
    })
  }

  const termsByYear = useMemo(() => {
    const map = {}
    for (const t of terms ?? []) {
      ;(map[t.schoolYearId] ??= []).push(t)
    }
    for (const id of Object.keys(map)) {
      map[id].sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    }
    return map
  }, [terms])

  const sortedYears = useMemo(
    () =>
      [...(schoolYears ?? [])].sort(
        (a, b) => new Date(b.startDate) - new Date(a.startDate),
      ),
    [schoolYears],
  )

  return (
    <div className="app-content">
      <div className="card-title-row">
        <div>
          <h1 className="card-title" style={{ fontSize: '28px', fontWeight: 800 }}>School Years</h1>
          <p className="card-subtitle">Manage academic years and their terms</p>
        </div>
        <button
          type="button"
          className="pill-button"
          style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
          onClick={() => setModal({ kind: 'year' })}
        >
          <IconPlus size={18} />
          New School Year
        </button>
      </div>

      {isLoading && <p style={{ padding: '16px' }}>Loading…</p>}
      {isError && <p style={{ padding: '16px', color: 'crimson' }}>Failed to load school years.</p>}

      {!isLoading && !isError && sortedYears.length === 0 && (
        <p style={{ padding: '16px', color: 'var(--text-soft)' }}>
          No school years yet. Create one to get started.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
        {sortedYears.map((year) => {
          const yearTerms = termsByYear[year.id] ?? []
          return (
            <div
              key={year.id}
              style={{
                border: '1px solid var(--border-soft, #e3e3e3)',
                borderRadius: '10px',
                padding: '16px',
                background: 'var(--surface, #fff)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>{year.name}</h3>
                    {year.isActive && (
                      <span
                        style={{
                          background: '#22c55e',
                          color: 'white',
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: 600,
                        }}
                      >
                        Active
                      </span>
                    )}
                  </div>
                  <div style={{ color: 'var(--text-soft)', fontSize: '13px', marginTop: '4px' }}>
                    {fmtDate(year.startDate)} → {fmtDate(year.endDate)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="pill-button"
                    style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '13px' }}
                    onClick={() => setModal({ kind: 'term', schoolYearId: year.id, schoolYearName: year.name })}
                  >
                    <IconPlus size={14} />
                    Add Term
                  </button>
                  <button
                    type="button"
                    title="Edit school year"
                    aria-label={`Edit ${year.name}`}
                    style={iconBtn}
                    onClick={() => setModal({ kind: 'year', mode: 'edit', year })}
                  >
                    <IconPencil size={16} />
                  </button>
                  <button
                    type="button"
                    title="Delete school year"
                    aria-label={`Delete ${year.name}`}
                    style={{ ...iconBtn, color: '#ef4444' }}
                    onClick={() => setConfirm({ kind: 'year', entity: year })}
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>

              {yearTerms.length > 0 && (
                <div style={{ marginTop: '12px', display: 'grid', gap: '6px' }}>
                  {yearTerms.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        background: 'var(--surface-soft, #f6f6f8)',
                        borderRadius: '6px',
                        fontSize: '13px',
                      }}
                    >
                      <strong>{t.name}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: 'var(--text-soft)' }}>
                          {fmtDate(t.startDate)} → {fmtDate(t.endDate)}
                        </span>
                        <button
                          type="button"
                          title="Edit term"
                          aria-label={`Edit ${t.name}`}
                          onClick={() => setModal({ kind: 'term', mode: 'edit', term: t, schoolYearName: year.name })}
                          style={iconBtn}
                        >
                          <IconPencil size={15} />
                        </button>
                        <button
                          type="button"
                          title="Delete term"
                          aria-label={`Delete ${t.name}`}
                          onClick={() => setConfirm({ kind: 'term', entity: t })}
                          style={{ ...iconBtn, color: '#ef4444' }}
                        >
                          <IconTrash size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {modal?.kind === 'year' && (
        <SchoolYearForm
          mode={modal.mode ?? 'create'}
          initial={modal.year}
          onClose={() => setModal(null)}
          onSubmit={(payload) => {
            const mutation = modal.mode === 'edit' ? updateYear : createYear
            mutation.mutate(payload, { onSuccess: () => setModal(null) })
          }}
          isSubmitting={createYear.isPending || updateYear.isPending}
        />
      )}
      {modal?.kind === 'term' && (
        <TermForm
          mode={modal.mode ?? 'create'}
          initial={modal.term}
          schoolYearId={modal.schoolYearId}
          schoolYearName={modal.schoolYearName}
          onClose={() => setModal(null)}
          onSubmit={(payload) => {
            const mutation = modal.mode === 'edit' ? updateTerm : createTerm
            mutation.mutate(payload, { onSuccess: () => setModal(null) })
          }}
          isSubmitting={createTerm.isPending || updateTerm.isPending}
        />
      )}

      {confirm && (
        <ConfirmDelete
          title={confirm.kind === 'year' ? 'Delete school year?' : 'Delete term?'}
          body={
            confirm.kind === 'year'
              ? `"${confirm.entity.name}" and all of its terms will be permanently deleted. This cannot be undone.`
              : `"${confirm.entity.name}" will be permanently deleted. This cannot be undone.`
          }
          error={deleteError}
          isPending={deleteYear.isPending || deleteTerm.isPending}
          onConfirm={handleConfirmDelete}
          onCancel={closeConfirm}
        />
      )}
    </div>
  )
}

export default SchoolYearsPage
