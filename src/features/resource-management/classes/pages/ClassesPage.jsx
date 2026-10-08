import { useMemo, useState } from 'react'
import EntityShell from '../../components/common/EntityShell'
import RMFilterPanel from '../../components/organisms/RMFilterPanel'
import { useRMFilters } from '../../common/filtering/useRMFilters'
import {
  useClassesQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeactivateClassMutation,
  useActivateClassMutation,
  useHardDeleteClassMutation,
} from '../api/hooks'
import { useDepartmentsQuery } from '../../departments/api/hooks'
import { useTeachersQuery } from '../../teachers/api/hooks'
import ClassForm from '../components/ClassForm'

const COLUMNS = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'fullName', header: 'Full Name', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'yearLevel', header: 'Year Level' },
  { accessorKey: 'department', header: 'Department' },
  { accessorKey: 'classTeacher', header: 'Class Teacher' },
  { accessorKey: 'parentClass', header: 'Parent Class' },
  { accessorKey: 'homeRoom', header: 'Home Room', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'maleStudents', header: 'Male' },
  { accessorKey: 'femaleStudents', header: 'Female' },
  { accessorKey: 'studentCount', header: 'Total Students' },
  { accessorKey: 'maxPeriodsPerDay', header: 'Max Periods/Day' },
  { accessorKey: 'maxConsecutiveSubjects', header: 'Max Consec. Subjects' },
  { accessorKey: 'consecutiveMainSubjects', header: 'Consec. Main Subjects' },
  { accessorKey: 'status', header: 'Status' },
]

const FACETS = [
  { key: 'yearLevel', title: 'Year Level', getValue: (row) => String(row.yearLevel) },
  { key: 'department', title: 'Department', getValue: (row) => row.department === '—' ? null : row.department },
  { key: 'status', title: 'Status', getValue: (row) => row.status },
]

const ClassesPage = () => {
  const { data: classes, isLoading, isError } = useClassesQuery()
  const { data: departments } = useDepartmentsQuery()
  const { data: teachers } = useTeachersQuery()
  const create = useCreateClassMutation()
  const update = useUpdateClassMutation()
  const deactivate = useDeactivateClassMutation()
  const activate = useActivateClassMutation()
  const hardDelete = useHardDeleteClassMutation()

  const [modal, setModal] = useState(null)

  const deptMap = useMemo(
    () => Object.fromEntries((departments ?? []).map((d) => [d.id, d.name])),
    [departments],
  )
  const teacherMap = useMemo(
    () => Object.fromEntries((teachers ?? []).map((t) => [t.id, t.displayName])),
    [teachers],
  )
  const classMap = useMemo(
    () => Object.fromEntries((classes ?? []).map((c) => [c.id, c.name])),
    [classes],
  )
  const rawById = useMemo(
    () => Object.fromEntries((classes ?? []).map((c) => [c.id, c])),
    [classes],
  )

  const resolvedData = useMemo(
    () =>
      (classes ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        fullName: c.fullName ?? '—',
        yearLevel: c.yearLevel,
        department: deptMap[c.departmentId] ?? '—',
        classTeacher: teacherMap[c.classTeacherId] ?? '—',
        parentClass: classMap[c.parentClassId] ?? '—',
        homeRoom: c.homeRoom ?? '—',
        maleStudents: c.maleStudents ?? 0,
        femaleStudents: c.femaleStudents ?? 0,
        studentCount: c.studentCount ?? 0,
        maxPeriodsPerDay: c.maxPeriodsPerDay ?? 0,
        maxConsecutiveSubjects: c.maxConsecutiveSubjects ?? 0,
        consecutiveMainSubjects: c.consecutiveMainSubjects ?? 0,
        status: c.isActive ? 'Active' : 'Inactive',
      })),
    [classes, deptMap, teacherMap, classMap],
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
        name="Classes"
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
        <ClassForm
          mode={modal.mode}
          initial={modal.entity}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          isSubmitting={create.isPending || update.isPending}
          departments={departments}
          teachers={teachers}
          classes={classes}
        />
      )}
    </>
  )
}

export default ClassesPage
