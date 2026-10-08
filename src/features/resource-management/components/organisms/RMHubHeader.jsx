import { IconPlus } from '@tabler/icons-react'
import RMSearchControl from '../molecules/RMSearchControl'
import RMBatchActions from '../molecules/RMBatchActions'
import SelectAllPill from '../atoms/SelectAllPill'
import './RMHubHeader.css'

const RMHubHeader = ({
  selectedCount,
  searchQuery,
  setSearchQuery,
  onToggleAll,
  onActivate,
  onDeactivate,
  onHardDelete,
  onClear,
  isAllSelected,
  searchPlaceholder,
  onFilterToggle,
  isFilterOpen = false,
  onAddRow,
  addLabel = 'New',
}) => {
  return (
    <div className="page-card rm-hub-header-card">
      <div className="rm-batch-actions-container">
        <div className="rm-search-controls-row">
          <RMSearchControl
            value={searchQuery}
            onChange={setSearchQuery}
            onFilter={onFilterToggle}
            isFilterOpen={isFilterOpen}
            placeholder={searchPlaceholder}
          />
        </div>

        <div className="rm-hub-actions">
          {onAddRow && (
            <button type="button" className="rm-add-button" onClick={onAddRow}>
              <IconPlus size={16} />
              <span className="rm-add-label">{addLabel}</span>
            </button>
          )}
          <div className="rm-batch-actions-bar">
            <RMBatchActions
              count={selectedCount}
              onActivate={onActivate}
              onDeactivate={onDeactivate}
              onHardDelete={onHardDelete}
              onClear={onClear}
            />
            <SelectAllPill checked={isAllSelected} onToggle={onToggleAll} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RMHubHeader
