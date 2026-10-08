import { useMemo, useState } from 'react'
import EntityShell from '../../components/common/EntityShell'
import RMFilterPanel from '../../components/organisms/RMFilterPanel'
import { useRMFilters } from '../../common/filtering/useRMFilters'
import {
  useSubjectsQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeactivateSubjectMutation,
  useActivateSubjectMutation,
  useHardDeleteSubjectMutation,
} from '../api/hooks'
import { useDepartmentsQuery } from '../../departments/api/hooks'
import { useRoomsQuery } from '../../rooms/api/hooks'
import SubjectForm from '../components/SubjectForm'

const COLUMNS = [
  { accessorKey: 'code', header: 'Code' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'category', header: 'Category', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'department', header: 'Department' },
  { accessorKey: 'preferredRoom', header: 'Preferred Room' },
  { accessorKey: 'requiredRoomType', header: 'Required Room Type', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'minPeriodsPerWeek', header: 'Min P/Week' },
  { accessorKey: 'maxPeriodsPerWeek', header: 'Max P/Week' },
  { accessorKey: 'minPeriodsPerDay', header: 'Min P/Day' },
  { accessorKey: 'maxPeriodsPerDay', header: 'Max P/Day' },
  { accessorKey: 'consecutivePeriodsClass', header: 'Consec. (Class)' },
  { accessorKey: 'consecutivePeriodsTeacher', header: 'Consec. (Teacher)' },
  { accessorKey: 'factor', header: 'Factor' },
  { accessorKey: 'status', header: 'Status' },
]

const FACETS = [
  { key: 'category', title: 'Category', getValue: (row) => row.category === '—' ? null : row.category },
  { key: 'department', title: 'Department', getValue: (row) => row.department === '—' ? null : row.department },
  { key: 'status', title: 'Status', getValue: (row) => row.status },
]

const SubjectsPage = () => {
  const { data: subjects, isLoading, isError } = useSubjectsQuery()
  const { data: departments } = useDepartmentsQuery()
  const { data: rooms } = useRoomsQuery()
  const create = useCreateSubjectMutation()
  const update = useUpdateSubjectMutation()
  const deactivate = useDeactivateSubjectMutation()
  const activate = useActivateSubjectMutation()
  const hardDelete = useHardDeleteSubjectMutation()

  const [modal, setModal] = useState(null)

  const deptMap = useMemo(
    () => Object.fromEntries((departments ?? []).map((d) => [d.id, d.name])),
    [departments],
  )
  const roomMap = useMemo(
    () => Object.fromEntries((rooms ?? []).map((r) => [r.id, r.name])),
    [rooms],
  )
  const rawById = useMemo(
    () => Object.fromEntries((subjects ?? []).map((s) => [s.id, s])),
    [subjects],
  )

  const resolvedData = useMemo(
    () =>
      (subjects ?? []).map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        category: s.category ?? '—',
        department: deptMap[s.departmentId] ?? '—',
        preferredRoom: roomMap[s.preferredRoomId] ?? '—',
        requiredRoomType: s.requiredRoomType ?? '—',
        minPeriodsPerWeek: s.minPeriodsPerWeek ?? 0,
        maxPeriodsPerWeek: s.maxPeriodsPerWeek ?? 0,
        minPeriodsPerDay: s.minPeriodsPerDay ?? 0,
        maxPeriodsPerDay: s.maxPeriodsPerDay ?? 0,
        consecutivePeriodsClass: s.consecutivePeriodsClass ?? 0,
        consecutivePeriodsTeacher: s.consecutivePeriodsTeacher ?? 0,
        factor: s.factor ?? 1,
        status: s.isActive ? 'Active' : 'Inactive',
      })),
    [subjects, deptMap, roomMap],
  )

  const filters = useRMFilters(resolvedData, FACETS)

  const handleSubmit = (payload) => {
    if (modal.mode === 'create') {
      create.mutate(payload, { onSuccess: () => setModal(null) })
    } else {
      update.mutate({ id: modal.entity.id, ...payload }, { onSuccess: () => setModal(null) })
    }
  }

  const filterPanel = (
    <RMFilterPanel
      isOpen={filters.isFilterOpen}
      activeFilterCount={filters.activeFilterCount}
      resultCount={filters.filteredData.length}
      onClearAll={filters.clearAll}
      facets={filters.facets}
      activeFilterChips={filters.activeFilterChips}
    />
  )

  return (
    <>
      <EntityShell
        name="Subjects"
        tableData={filters.filteredData}
        tableColumns={COLUMNS}
        isLoading={isLoading}
        isError={isError}
        searchQuery={filters.searchQuery}
        setSearchQuery={filters.setSearchQuery}
        filterPanel={filterPanel}
        isFilterOpen={filters.isFilterOpen}
        onFilterToggle={filters.toggleFilterPanel}
        onDeleteRow={(row) => deactivate.mutate(row.id)}
        onDeleteSelected={(ids) => ids.forEach((id) => deactivate.mutate(id))}
        onActivateSelected={(ids) => ids.forEach((id) => activate.mutate(id))}
        onHardDeleteRow={(row) => hardDelete.mutate(row.id)}
        onHardDeleteSelected={(ids) => ids.forEach((id) => hardDelete.mutate(id))}
        onEditRow={(row) => setModal({ mode: 'edit', entity: rawById[row.id] })}
        onAddRow={() => setModal({ mode: 'create', entity: null })}
      />
      {modal && (
        <SubjectForm
          mode={modal.mode}
          initial={modal.entity}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          isSubmitting={create.isPending || update.isPending}
          departments={departments}
          rooms={rooms}
        />
      )}
    </>
  )
}

export default SubjectsPage
