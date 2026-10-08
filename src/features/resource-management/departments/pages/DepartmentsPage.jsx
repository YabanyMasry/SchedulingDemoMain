import { useMemo, useState } from 'react'
import EntityShell from '../../components/common/EntityShell'
import RMFilterPanel from '../../components/organisms/RMFilterPanel'
import { useRMFilters } from '../../common/filtering/useRMFilters'
import {
  useDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeactivateDepartmentMutation,
  useActivateDepartmentMutation,
  useHardDeleteDepartmentMutation,
} from '../api/hooks'
import DepartmentForm from '../components/DepartmentForm'

const COLUMNS = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'fullName', header: 'Full Name', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'status', header: 'Status' },
]

const FACETS = [
  { key: 'status', title: 'Status', getValue: (row) => row.status },
]

const DepartmentsPage = () => {
  const { data: departments, isLoading, isError } = useDepartmentsQuery()
  const create = useCreateDepartmentMutation()
  const update = useUpdateDepartmentMutation()
  const deactivate = useDeactivateDepartmentMutation()
  const activate = useActivateDepartmentMutation()
  const hardDelete = useHardDeleteDepartmentMutation()

  const [modal, setModal] = useState(null)

  const rawById = useMemo(
    () => Object.fromEntries((departments ?? []).map((d) => [d.id, d])),
    [departments],
  )

  const resolvedData = useMemo(
    () =>
      (departments ?? []).map((d) => ({
        id: d.id,
        name: d.name,
        fullName: d.fullName ?? '—',
        status: d.isActive ? 'Active' : 'Inactive',
      })),
    [departments],
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
        name="Departments"
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
        <DepartmentForm
          mode={modal.mode}
          initial={modal.entity}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          isSubmitting={create.isPending || update.isPending}
        />
      )}
    </>
  )
}

export default DepartmentsPage
