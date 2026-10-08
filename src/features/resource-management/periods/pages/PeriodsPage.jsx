import { useMemo, useState } from 'react'
import EntityShell from '../../components/common/EntityShell'
import RMFilterPanel from '../../components/organisms/RMFilterPanel'
import { useRMFilters } from '../../common/filtering/useRMFilters'
import { usePeriodsQuery, useCreatePeriodMutation, useUpdatePeriodMutation, useDeactivatePeriodMutation, useActivatePeriodMutation, useHardDeletePeriodMutation } from '../api/hooks'
import PeriodForm from '../components/PeriodForm'

const fmtTime = (t) => (t ? String(t).substring(0, 5) : '—')

const COLUMNS = [
  { accessorKey: 'periodNumber', header: '#' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'startTime', header: 'Start' },
  { accessorKey: 'endTime', header: 'End' },
  { accessorKey: 'durationMinutes', header: 'Duration (min)' },
  { accessorKey: 'isBreak', header: 'Break' },
  { accessorKey: 'status', header: 'Status' },
]

const FACETS = [
  { key: 'isBreak', title: 'Type', getValue: (row) => row.isBreak },
  { key: 'status', title: 'Status', getValue: (row) => row.status },
]

const PeriodsPage = () => {
  const { data, isLoading, isError } = usePeriodsQuery()
  const create = useCreatePeriodMutation()
  const update = useUpdatePeriodMutation()
  const deactivate = useDeactivatePeriodMutation()
  const activate = useActivatePeriodMutation()
  const hardDelete = useHardDeletePeriodMutation()

  const [modal, setModal] = useState(null)

  const rawById = useMemo(
    () => Object.fromEntries((data ?? []).map((p) => [p.id, p])),
    [data],
  )

  const resolvedData = useMemo(
    () =>
      (data ?? []).map((p) => ({
        id: p.id,
        periodNumber: p.periodNumber,
        name: p.name,
        startTime: fmtTime(p.startTime),
        endTime: fmtTime(p.endTime),
        durationMinutes: p.durationMinutes,
        isBreak: p.isBreak ? 'Break' : 'Teaching',
        status: p.isActive ? 'Active' : 'Inactive',
      })),
    [data],
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
        name="Periods"
        tableData={filters.filteredData}
        tableColumns={COLUMNS}
        isLoading={isLoading}
        isError={isError}
        searchQuery={filters.searchQuery}
        setSearchQuery={filters.setSearchQuery}
        filterPanel={filterPanel}
        isFilterOpen={filters.isFilterOpen}
        onFilterToggle={filters.toggleFilterPanel}
        onEditRow={(row) => setModal({ mode: 'edit', entity: rawById[row.id] })}
        onAddRow={() => setModal({ mode: 'create', entity: null })}
        onDeleteRow={(row) => deactivate.mutate(row.id)}
        onDeleteSelected={(ids) => ids.forEach((id) => deactivate.mutate(id))}
        onActivateSelected={(ids) => ids.forEach((id) => activate.mutate(id))}
        onHardDeleteRow={(row) => hardDelete.mutate(row.id)}
        onHardDeleteSelected={(ids) => ids.forEach((id) => hardDelete.mutate(id))}
      />
      {modal && (
        <PeriodForm
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

export default PeriodsPage
