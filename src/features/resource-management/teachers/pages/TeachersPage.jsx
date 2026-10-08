import { useMemo, useState } from 'react'
import EntityShell from '../../components/common/EntityShell'
import RMFilterPanel from '../../components/organisms/RMFilterPanel'
import { useRMFilters } from '../../common/filtering/useRMFilters'
import {
  useTeachersQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useDeactivateTeacherMutation,
  useActivateTeacherMutation,
  useHardDeleteTeacherMutation,
} from '../api/hooks'
import { useDepartmentsQuery } from '../../departments/api/hooks'
import TeacherForm from '../components/TeacherForm'

const NOTIFICATION_LABEL = { 1: 'Email', 2: 'SMS', 3: 'Both', 4: 'Phone' }

const COLUMNS = [
  { accessorKey: 'displayName', header: 'Name' },
  { accessorKey: 'firstName', header: 'First Name' },
  { accessorKey: 'lastName', header: 'Last Name', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'title', header: 'Title', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'email', header: 'Email', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'phoneNumber', header: 'Phone', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'mobileNumber', header: 'Mobile', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'department', header: 'Department' },
  { accessorKey: 'personnelNumber', header: 'Personnel #', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'homeRoom', header: 'Home Room', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'weeklyQuota', header: 'Weekly Quota', cell: ({ getValue }) => getValue() ?? '—' },
  { accessorKey: 'gender', header: 'Gender', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'dateOfBirth', header: 'Date of Birth', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'availableForSubstitution', header: 'Substitution' },
  { accessorKey: 'maxSubstitutionsPerWeek', header: 'Max Subs/Week', cell: ({ getValue }) => getValue() ?? '—' },
  { accessorKey: 'substitutionHourlyRate', header: 'Hourly Rate', cell: ({ getValue }) => getValue() ?? '—' },
  { accessorKey: 'preferredNotification', header: 'Notification' },
  { accessorKey: 'status', header: 'Status' },
]

const FACETS = [
  { key: 'department', title: 'Department', getValue: (row) => row.department === '—' ? null : row.department },
  { key: 'gender', title: 'Gender', getValue: (row) => row.gender === '—' ? null : row.gender },
  { key: 'availableForSubstitution', title: 'Available for Sub', getValue: (row) => row.availableForSubstitution },
  { key: 'preferredNotification', title: 'Notification Pref', getValue: (row) => row.preferredNotification },
  { key: 'status', title: 'Status', getValue: (row) => row.status },
]

const fmtDate = (d) => (d ? String(d).substring(0, 10) : '—')

const TeachersPage = () => {
  const { data: teachers, isLoading, isError } = useTeachersQuery()
  const { data: departments } = useDepartmentsQuery()
  const create = useCreateTeacherMutation()
  const update = useUpdateTeacherMutation()
  const deactivate = useDeactivateTeacherMutation()
  const activate = useActivateTeacherMutation()
  const hardDelete = useHardDeleteTeacherMutation()

  const [modal, setModal] = useState(null)

  const deptMap = useMemo(
    () => Object.fromEntries((departments ?? []).map((d) => [d.id, d.name])),
    [departments],
  )

  const rawById = useMemo(
    () => Object.fromEntries((teachers ?? []).map((t) => [t.id, t])),
    [teachers],
  )

  const resolvedData = useMemo(
    () =>
      (teachers ?? []).map((t) => ({
        id: t.id,
        displayName: t.displayName,
        firstName: t.firstName,
        lastName: t.lastName ?? '—',
        title: t.title ?? '—',
        email: t.email ?? '—',
        phoneNumber: t.phoneNumber ?? '—',
        mobileNumber: t.mobileNumber ?? '—',
        department: deptMap[t.departmentId] ?? '—',
        personnelNumber: t.personnelNumber ?? '—',
        homeRoom: t.homeRoom ?? '—',
        weeklyQuota: t.weeklyQuota ?? '—',
        gender: t.gender ?? '—',
        dateOfBirth: fmtDate(t.dateOfBirth),
        availableForSubstitution: t.availableForSubstitution ? 'Yes' : 'No',
        maxSubstitutionsPerWeek: t.maxSubstitutionsPerWeek ?? '—',
        substitutionHourlyRate: t.substitutionHourlyRate ?? '—',
        preferredNotification: NOTIFICATION_LABEL[t.preferredNotification] ?? '—',
        status: t.isActive ? 'Active' : 'Inactive',
      })),
    [teachers, deptMap],
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
        name="Teachers"
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
        <TeacherForm
          mode={modal.mode}
          initial={modal.entity}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          isSubmitting={create.isPending || update.isPending}
          departments={departments}
        />
      )}
    </>
  )
}

export default TeachersPage
