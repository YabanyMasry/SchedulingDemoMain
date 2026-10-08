import { useMemo, useState } from 'react'
import EntityShell from '../../components/common/EntityShell'
import RMFilterPanel from '../../components/organisms/RMFilterPanel'
import { useRMFilters } from '../../common/filtering/useRMFilters'
import {
  useRoomsQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeactivateRoomMutation,
  useActivateRoomMutation,
  useHardDeleteRoomMutation,
} from '../api/hooks'
import { useDepartmentsQuery } from '../../departments/api/hooks'
import RoomForm from '../components/RoomForm'

const COLUMNS = [
  { accessorKey: 'roomNumber', header: 'Room #' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'roomType', header: 'Type', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'capacity', header: 'Capacity' },
  { accessorKey: 'department', header: 'Department' },
  { accessorKey: 'alternativeRoom', header: 'Alternative Room' },
  { accessorKey: 'building', header: 'Building', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'floor', header: 'Floor', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'facilities', header: 'Facilities', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'status', header: 'Status' },
]

const FACETS = [
  { key: 'roomType', title: 'Room Type', getValue: (row) => row.roomType === '—' ? null : row.roomType },
  { key: 'building', title: 'Building', getValue: (row) => row.building === '—' ? null : row.building },
  { key: 'department', title: 'Department', getValue: (row) => row.department === '—' ? null : row.department },
  { key: 'status', title: 'Status', getValue: (row) => row.status },
]

const RoomsPage = () => {
  const { data: rooms, isLoading, isError } = useRoomsQuery()
  const { data: departments } = useDepartmentsQuery()
  const create = useCreateRoomMutation()
  const update = useUpdateRoomMutation()
  const deactivate = useDeactivateRoomMutation()
  const activate = useActivateRoomMutation()
  const hardDelete = useHardDeleteRoomMutation()

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
    () => Object.fromEntries((rooms ?? []).map((r) => [r.id, r])),
    [rooms],
  )

  const resolvedData = useMemo(
    () =>
      (rooms ?? []).map((r) => ({
        id: r.id,
        roomNumber: r.roomNumber,
        name: r.name,
        roomType: r.roomType ?? '—',
        capacity: r.capacity,
        department: deptMap[r.departmentId] ?? '—',
        alternativeRoom: roomMap[r.alternativeRoomId] ?? '—',
        building: r.building ?? '—',
        floor: r.floor ?? '—',
        facilities: r.facilities ?? '—',
        status: r.isActive ? 'Active' : 'Inactive',
      })),
    [rooms, deptMap, roomMap],
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
        name="Rooms"
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
        <RoomForm
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

export default RoomsPage
