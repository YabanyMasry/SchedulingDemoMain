import { useState } from 'react'
import SearchControl from '../molecules/SearchControl'
import BatchActions from '../molecules/BatchActions'
import './HubHeader.css'

const HubHeader = ({
  selectedCount,
  searchQuery,
  setSearchQuery,
  onToggleAll,
  onCompare,
  onDelete,
  onClear,
  isAllSelected
}) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)

  return (
    <div className="page-card hub-header-card">
      <div className="batch-actions-container">
        <div className="search-controls-row">
          <SearchControl
            value={searchQuery}
            onChange={setSearchQuery}
            onFilter={() => console.log('Filter clicked')}
            isMobileSearchOpen={isMobileSearchOpen}
            onToggleMobileSearch={() => setIsMobileSearchOpen((prev) => !prev)}
          />
        </div>

        <div
          className={`batch-actions-bar ${
            isMobileSearchOpen ? 'batch-actions-mobile-hidden' : ''
          }`}
        >


          <BatchActions
            count={selectedCount}
            onDelete={onDelete}
            onCompare={onCompare}
            onClear={onClear}
          />

          <div className="select-all-group" onClick={onToggleAll}>
            <input
              type="checkbox"
              className="card-checkbox"
              style={{ position: 'static', margin: 0 }}
              checked={isAllSelected}
              readOnly
            />
            <span style={{ fontSize: '14px', color: 'var(--text-soft)', fontWeight: 500 }}>All</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HubHeader
