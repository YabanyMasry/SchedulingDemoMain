import { useMemo, useState } from 'react'
import { IconPencil, IconTrash, IconTrashX } from '@tabler/icons-react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

// Patterns used to detect the semantic type of a cell value for smart sorting
const NUMERIC_PATTERN = /^-?\d+(\.\d+)?$/
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(?:[Tt ][\d:.+-Zz]+)?$/

// Classifies a raw cell value into a typed bucket so mixed-type columns sort
// in a semantically correct order (numbers numerically, dates chronologically,
// strings lexicographically, and empty/null values always last)
const toComparableValue = (value) => {
  if (value === null || value === undefined) {
    return { type: 'empty', value: '' }
  }

  if (Array.isArray(value)) {
    return { type: 'string', value: value.join(' ').toLowerCase() }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { type: 'date', value: value.getTime() }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return { type: 'number', value }
  }

  // Booleans are sorted as 0/1 so they group correctly alongside numeric columns
  if (typeof value === 'boolean') {
    return { type: 'number', value: value ? 1 : 0 }
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim()

    if (!trimmedValue) {
      return { type: 'empty', value: '' }
    }

    // Strip thousands separators before testing for numeric content ("1,200" → 1200)
    const normalizedNumber = trimmedValue.replace(/,/g, '')

    if (NUMERIC_PATTERN.test(normalizedNumber)) {
      return { type: 'number', value: Number(normalizedNumber) }
    }

    if (ISO_DATE_PATTERN.test(trimmedValue)) {
      const parsedDate = Date.parse(trimmedValue)

      if (!Number.isNaN(parsedDate)) {
        return { type: 'date', value: parsedDate }
      }
    }

    return { type: 'string', value: trimmedValue.toLowerCase() }
  }

  return { type: 'string', value: String(value).toLowerCase() }
}

// Compares two cell values using their detected types.
// Empty values are always pushed to the end regardless of sort direction.
// When types differ (e.g. a number vs a string in the same column), falls back
// to localeCompare with numeric sensitivity for a consistent result.
const compareByDetectedType = (leftValue, rightValue) => {
  const leftComparable = toComparableValue(leftValue)
  const rightComparable = toComparableValue(rightValue)

  if (leftComparable.type === 'empty' && rightComparable.type === 'empty') {
    return 0
  }

  if (leftComparable.type === 'empty') {
    return 1
  }

  if (rightComparable.type === 'empty') {
    return -1
  }

  if (leftComparable.type === rightComparable.type) {
    if (leftComparable.type === 'string') {
      return leftComparable.value.localeCompare(rightComparable.value, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    }

    return leftComparable.value === rightComparable.value
      ? 0
      : leftComparable.value > rightComparable.value
        ? 1
        : -1
  }

  return String(leftComparable.value).localeCompare(
    String(rightComparable.value),
    undefined,
    {
      numeric: true,
      sensitivity: 'base',
    },
  )
}

// TanStack Table sorting function adapter — wraps compareByDetectedType with the
// (rowA, rowB, columnId) signature that TanStack Table expects
const detectedTypeSortingFn = (rowA, rowB, columnId) =>
  compareByDetectedType(rowA.getValue(columnId), rowB.getValue(columnId))

const EntityTable = ({
  data,
  columns,
  emptyMessage = 'No records available.',
  selectedRowIds = [],
  onToggleRowSelection,
  onEditRow,
  onDeleteRow,
  onHardDeleteRow,
  rowIdAccessor = '__rowId',
}) => {
  const [sorting, setSorting] = useState([])

  const tableColumns = useMemo(
    () => [
      // Selection checkbox column prepended before caller-supplied columns.
      // Reads rowIdAccessor to resolve the row's stable string ID so the parent
      // can track selection by the same key it used to populate the data.
      {
        id: '__selection',
        header: () => <span className="table-select-header" />,
        enableSorting: false,
        cell: ({ row }) => {
          const rowId = String(row.original?.[rowIdAccessor] ?? row.id)
          const isSelected = selectedRowIds.includes(rowId)

          return (
            <div className="table-select-cell">
              <input
                type="checkbox"
                className="table-row-checkbox"
                checked={isSelected}
                onChange={() => onToggleRowSelection?.(row.original)}
                aria-label="Select row"
              />
            </div>
          )
        },
      },
      // Spread caller column definitions and apply defaults so individual column
      // definitions don't need to repeat boilerplate: sorting is enabled by default,
      // the detectedType function handles mixed-type columns, and undefined values sort last
      ...columns.map((column) => ({
        ...column,
        enableSorting: column.enableSorting ?? true,
        sortingFn: column.sortingFn ?? detectedTypeSortingFn,
        sortUndefined: column.sortUndefined ?? 'last',
      })),
      // Actions column appended after all data columns.
      // Three buttons: edit (pencil), soft-delete (trash), hard-delete (trash-x).
      {
        id: '__actions',
        header: () => <span className="table-actions-header">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="table-actions-cell">
            <div className="table-actions-group">
              <button
                type="button"
                className="icon-button table-action-button"
                aria-label="Edit row"
                onClick={() => onEditRow?.(row.original)}
              >
                <IconPencil size={16} />
              </button>
              <button
                type="button"
                className="icon-button table-action-button table-action-button-delete"
                aria-label="Deactivate row"
                title="Deactivate"
                onClick={() => onDeleteRow?.(row.original)}
              >
                <IconTrash size={16} />
              </button>
              <button
                type="button"
                className="icon-button table-action-button table-action-button-hard-delete"
                aria-label="Permanently delete row"
                title="Permanently delete"
                onClick={() => onHardDeleteRow?.(row.original)}
              >
                <IconTrashX size={16} />
              </button>
            </div>
          </div>
        ),
      },
    ],
    [
      columns,
      onDeleteRow,
      onHardDeleteRow,
      onEditRow,
      onToggleRowSelection,
      rowIdAccessor,
      selectedRowIds,
    ],
  )

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <table className="data-table">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const canSort = header.column.getCanSort()
              const sortState = header.column.getIsSorted()

              return (
                <th key={header.id}>
                  {header.isPlaceholder ? null : canSort ? (
                    <button
                      type="button"
                      className="table-sort-button"
                      onClick={header.column.getToggleSortingHandler()}
                      aria-label={`Toggle sort for ${header.column.id}`}
                    >
                      <span className="table-sort-label">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </span>
                      <span
                        className={`table-sort-indicator ${sortState ? 'table-sort-indicator-active' : ''}`}
                        aria-hidden="true"
                      >
                        {sortState === 'asc'
                          ? '▲'
                          : sortState === 'desc'
                            ? '▼'
                            : '↕'}
                      </span>
                    </button>
                  ) : (
                    flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )
                  )}
                </th>
              )
            })}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={tableColumns.length}>{emptyMessage}</td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

export default EntityTable
