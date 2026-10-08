import { createPortal } from 'react-dom'
import { useEffect, useMemo, useState } from 'react'
import { IconTrashX } from '@tabler/icons-react'
import EntityTable from './EntityTable'
import EntityListHeader from './EntityListHeader'
import EntityPageNotes from './EntityPageNotes'
import RMHubHeader from '../organisms/RMHubHeader'
import { withStableRowIds } from '../../common/filtering/rmFiltering'
import './EntityShell.css'

const HardDeleteConfirm = ({ count, onConfirm, onCancel }) =>
  createPortal(
    <div
      className="es-confirm-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="es-confirm-modal" role="dialog" aria-modal="true">
        <div className="es-confirm-icon">
          <IconTrashX size={24} />
        </div>
        <h3 className="es-confirm-title">Permanently delete?</h3>
        <p className="es-confirm-body">
          {count === 1
            ? 'This record will be permanently removed from the database. This cannot be undone.'
            : `${count} records will be permanently removed from the database. This cannot be undone.`}
        </p>
        <div className="es-confirm-actions">
          <button className="es-confirm-cancel" onClick={onCancel}>Cancel</button>
          <button className="es-confirm-delete" onClick={onConfirm}>
            <IconTrashX size={14} />
            Delete permanently
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )

const EntityShell = ({
  name,
  tableData = [],
  tableColumns,
  isLoading = false,
  isError = false,
  onDeleteRow,
  onDeleteSelected,
  onActivateSelected,
  onHardDeleteRow,
  onHardDeleteSelected,
  onEditRow,
  onAddRow,
  // Controlled filter props — supplied by useRMFilters
  searchQuery: externalSearchQuery,
  setSearchQuery: externalSetSearchQuery,
  filterPanel,
  isFilterOpen = false,
  onFilterToggle,
}) => {
  const isControlled = externalSearchQuery !== undefined

  const [internalQuery, setInternalQuery] = useState('')
  const searchQuery = isControlled ? externalSearchQuery : internalQuery
  const setSearchQuery = isControlled ? externalSetSearchQuery : setInternalQuery

  const [selectedRowIds, setSelectedRowIds] = useState([])
  const [records, setRecords] = useState(() => withStableRowIds(tableData, name))
  // Stores the pending hard-delete action: { action: () => void, count: number }
  const [pendingHardDelete, setPendingHardDelete] = useState(null)

  useEffect(() => {
    setRecords(withStableRowIds(tableData, name))
    setSelectedRowIds([])
  }, [name, tableData])

  const defaultColumns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: `${name} Name`,
        cell: ({ getValue }) => getValue() || '-',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => getValue() || 'Active',
      },
    ],
    [name],
  )

  const filteredData = useMemo(() => {
    if (isControlled) return records
    const q = searchQuery.trim().toLowerCase()
    if (!q) return records
    return records.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? '').toLowerCase().includes(q),
      ),
    )
  }, [isControlled, records, searchQuery])

  const filteredRowIds = useMemo(
    () => filteredData.map((row) => row.__rowId),
    [filteredData],
  )

  const selectedCount = selectedRowIds.length
  const isAllSelected =
    filteredRowIds.length > 0 &&
    filteredRowIds.every((id) => selectedRowIds.includes(id))

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedRowIds((prev) => prev.filter((id) => !filteredRowIds.includes(id)))
      return
    }
    setSelectedRowIds((prev) => Array.from(new Set([...prev, ...filteredRowIds])))
  }

  const handleClear = () => setSelectedRowIds([])

  // Batch: deactivate
  const handleDeactivate = () => {
    if (!selectedRowIds.length) return
    if (onDeleteSelected) {
      onDeleteSelected(selectedRowIds)
      setSelectedRowIds([])
      return
    }
    setRecords((prev) => prev.filter((row) => !selectedRowIds.includes(row.__rowId)))
    setSelectedRowIds([])
  }

  // Batch: activate
  const handleActivate = () => {
    if (!selectedRowIds.length || !onActivateSelected) return
    onActivateSelected(selectedRowIds)
    setSelectedRowIds([])
  }

  // Batch: hard delete — open confirm
  const handleHardDeleteSelected = () => {
    if (!selectedRowIds.length) return
    const ids = [...selectedRowIds]
    setPendingHardDelete({
      count: ids.length,
      action: () => {
        if (onHardDeleteSelected) {
          onHardDeleteSelected(ids)
        }
        setSelectedRowIds([])
      },
    })
  }

  const handleToggleRowSelection = (row) => {
    const rowId = row.__rowId
    setSelectedRowIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId],
    )
  }

  const handleDeleteRow = (row) => {
    if (onDeleteRow) {
      onDeleteRow(row)
      return
    }
    const rowId = row.__rowId
    setRecords((prev) => prev.filter((item) => item.__rowId !== rowId))
    setSelectedRowIds((prev) => prev.filter((id) => id !== rowId))
  }

  // Row: hard delete — open confirm
  const handleHardDeleteRow = (row) => {
    if (!onHardDeleteRow) return
    setPendingHardDelete({
      count: 1,
      action: () => onHardDeleteRow(row),
    })
  }

  const handleEditRow = (row) => {
    if (onEditRow) {
      onEditRow(row)
      return
    }
  }

  const handleConfirmHardDelete = () => {
    pendingHardDelete?.action()
    setPendingHardDelete(null)
  }

  return (
    <section className="page-card entity-shell-card">
      {pendingHardDelete && (
        <HardDeleteConfirm
          count={pendingHardDelete.count}
          onConfirm={handleConfirmHardDelete}
          onCancel={() => setPendingHardDelete(null)}
        />
      )}

      <h1>{name} Manager</h1>
      <p>{`Shared CRUD shell for ${name.toLowerCase()}.`}</p>

      {isLoading && <p style={{ color: 'var(--text-soft)' }}>Loading…</p>}
      {isError && (
        <p style={{ color: '#ef4444' }}>Failed to load {name.toLowerCase()}.</p>
      )}

      <RMHubHeader
        selectedCount={selectedCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onToggleAll={handleToggleAll}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onHardDelete={handleHardDeleteSelected}
        onClear={handleClear}
        isAllSelected={isAllSelected}
        searchPlaceholder={`Search ${name.toLowerCase()}...`}
        onFilterToggle={onFilterToggle}
        isFilterOpen={isFilterOpen}
        onAddRow={onAddRow}
        addLabel="New"
      />

      {filterPanel}

      <div className="entity-table-region">
        <EntityListHeader
          title="List View"
          subtitle={`${filteredData.length} record${filteredData.length !== 1 ? 's' : ''}`}
        />

        <EntityTable
          data={filteredData}
          columns={tableColumns ?? defaultColumns}
          emptyMessage={`No ${name.toLowerCase()} records match the current filters.`}
          selectedRowIds={selectedRowIds}
          onToggleRowSelection={handleToggleRowSelection}
          onEditRow={handleEditRow}
          onDeleteRow={handleDeleteRow}
          onHardDeleteRow={handleHardDeleteRow}
        />

        <EntityPageNotes
          tags={['entities', name.toLowerCase()]}
        />
      </div>
    </section>
  )
}

export default EntityShell
