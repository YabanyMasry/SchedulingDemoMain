import { IconSearch, IconFilter } from '@tabler/icons-react'
import CircleIconButton from '../atoms/CircleIconButton'

const RMSearchControl = ({
  value,
  onChange,
  onFilter,
  isFilterOpen = false,
  placeholder = 'Search resources...',
}) => {
  return (
    <div className="search-row rm-search-row">
      <div className="rm-search-expandable">
        <div className="rm-search-input-wrap">
          <IconSearch className="rm-search-icon" size={18} />
          <input
            className="pill-input rm-search-input"
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      </div>

      <CircleIconButton
        className={`rm-filter-button ${isFilterOpen ? 'rm-filter-button-active' : ''}`}
        icon={<IconFilter size={20} />}
        onClick={onFilter}
        aria-label={isFilterOpen ? 'Close filters' : 'Open filters'}
        aria-pressed={isFilterOpen}
      />
    </div>
  )
}

export default RMSearchControl
