import { useMemo, useState } from 'react'
import EntityShell from '../../components/common/EntityShell'
import RMFilterPanel from '../../components/organisms/RMFilterPanel'
import { useRMFilters } from '../../common/filtering/useRMFilters'
import {
  useStudentsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeactivateStudentMutation,
  useActivateStudentMutation,
  useHardDeleteStudentMutation,
} from '../api/hooks'
import { useClassesQuery } from '../../classes/api/hooks'
import StudentForm from '../components/StudentForm'

const GENDER_LABEL = { 0: 'Male', 1: 'Female' }

const COLUMNS = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'fullName', header: 'Full Name', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'studentNumber', header: 'Student #' },
  { accessorKey: 'className', header: 'Class' },
  { accessorKey: 'email', header: 'Email', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'gender', header: 'Gender' },
  { accessorKey: 'status', header: 'Status' },
]

const FACETS = [
  { key: 'className', title: 'Class', getValue: (row) => row.className === '—' ? null : row.className },
  { key: 'gender', title: 'Gender', getValue: (row) => row.gender === '—' ? null : row.gender },
  { key: 'status', title: 'Status', getValue: (row) => row.status },
]

const StudentsPage = () => {
  const { data: students, isLoading, isError } = useStudentsQuery()
  const { data: classes } = useClassesQuery()
  const create = useCreateStudentMutation()
  const update = useUpdateStudentMutation()
  const deactivate = useDeactivateStudentMutation()
  const activate = useActivateStudentMutation()
  const hardDelete = useHardDeleteStudentMutation()

  const [modal, setModal] = useState(null)

  const classMap = useMemo(
    () => Object.fromEntries((classes ?? []).map((c) => [c.id, c.name])),
    [classes],
  )

  const rawById = useMemo(
    () => Object.fromEntries((students ?? []).map((s) => [s.id, s])),
    [students],
  )

  const resolvedData = useMemo(
    () =>
      (students ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        fullName: s.fullName ?? '—',
        studentNumber: s.studentNumber,
        className: classMap[s.classId] ?? '—',
        email: s.email ?? '—',
        gender: GENDER_LABEL[s.gender] ?? '—',
        status: s.isActive ? 'Active' : 'Inactive',
      })),
    [students, classMap],
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
        name="Students"
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
        <StudentForm
          mode={modal.mode}
          initial={modal.entity}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          isSubmitting={create.isPending || update.isPending}
          classes={classes}
        />
      )}
    </>
  )
}

export default StudentsPage
