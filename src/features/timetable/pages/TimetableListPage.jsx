import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconPlus } from '@tabler/icons-react'
import HubHeader from '../components/organisms/HubHeader'
import TimetableGrid from '../components/organisms/TimetableGrid'
import TimetableForm from '../components/organisms/TimetableForm'
import {
  useTimetablesQuery,
  useCreateTimetableMutation,
  useRenameTimetableMutation,
  useDeleteTimetableMutation,
} from '../api/hooks'
import {
  useSchoolYearsQuery,
  useTermsQuery,
} from '../../resource-management/school-years/api/hooks'

const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

const TimetableListPage = () => {
  const navigate = useNavigate()
  const { data: timetables, isLoading, isError } = useTimetablesQuery()
  const { data: schoolYears } = useSchoolYearsQuery()
  const { data: terms } = useTermsQuery()

  const create = useCreateTimetableMutation()
  const rename = useRenameTimetableMutation()
  const remove = useDeleteTimetableMutation()

  const [selectedIds, setSelectedIds] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [modal, setModal] = useState(null)

  const yearMap = useMemo(
    () => Object.fromEntries((schoolYears ?? []).map((y) => [y.id, y.name])),
    [schoolYears],
  )

  const items = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return (timetables ?? [])
      .map((t) => ({
        id: t.id,
        title: t.name,
        description: [
          yearMap[t.schoolYearId] ?? '—',
          t.notes,
        ].filter(Boolean).join(' · '),
        status: (t.status ?? 'draft').toLowerCase(),
        updatedAt: fmtDate(t.publishedDate ?? t.createdDate),
        raw: t,
      }))
      .filter((t) =>
        !q || t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q),
      )
  }, [timetables, yearMap, searchQuery])

  const toggleSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  const toggleAll = () => {
    if (selectedIds.length === items.length) setSelectedIds([])
    else setSelectedIds(items.map((t) => t.id))
  }

  const handleEdit = (id) => {
    navigate(`/timetable/${id}/edit`)
  }

  const handleDelete = (id) => {
    if (!window.confirm('Delete this timetable? This cannot be undone.')) return
    remove.mutate(id)
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Delete ${selectedIds.length} timetable(s)?`)) return
    selectedIds.forEach((id) => remove.mutate(id))
    setSelectedIds([])
  }

  const handleSubmit = (payload) => {
    if (modal.mode === 'create') {
      create.mutate(payload, { onSuccess: () => setModal(null) })
    } else {
      rename.mutate(
        { id: modal.entity.id, newName: payload.newName },
        { onSuccess: () => setModal(null) },
      )
    }
  }

  return (
    <div className="app-content">
      <div className="card-title-row">
        <div>
          <h1 className="card-title" style={{ fontSize: '28px', fontWeight: 800 }}>Timetable List</h1>
          <p className="card-subtitle">Manage and distribute your academic schedules</p>
        </div>
        <button
          type="button"
          className="pill-button"
          style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
          onClick={() => setModal({ mode: 'create', entity: null })}
        >
          <IconPlus size={18} />
          Create New
        </button>
      </div>

      <HubHeader
        selectedCount={selectedIds.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onToggleAll={toggleAll}
        onCompare={() => console.log('Compare', selectedIds)}
        onDelete={handleBatchDelete}
        onClear={() => setSelectedIds([])}
        isAllSelected={selectedIds.length === items.length && items.length > 0}
      />

      {isLoading && <p style={{ padding: '16px' }}>Loading…</p>}
      {isError && <p style={{ padding: '16px', color: 'crimson' }}>Failed to load timetables.</p>}
      {!isLoading && !isError && items.length === 0 && (
        <p style={{ padding: '16px', color: 'var(--text-soft)' }}>
          {searchQuery ? 'No timetables match your search.' : 'No timetables yet. Create one to get started.'}
        </p>
      )}

      <TimetableGrid
        items={items}
        selectedIds={selectedIds}
        onToggle={toggleSelection}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {modal && (
        <TimetableForm
          mode={modal.mode}
          initial={modal.entity}
          schoolYears={schoolYears}
          terms={terms}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          isSubmitting={create.isPending || rename.isPending}
        />
      )}
    </div>
  )
}

export default TimetableListPage
