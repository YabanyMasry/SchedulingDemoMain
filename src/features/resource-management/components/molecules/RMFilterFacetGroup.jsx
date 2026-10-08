const RMFilterFacetGroup = ({
  title,
  helper,
  options,
  selectedValues,
  onToggle,
  onClear,
}) => {
  return (
    <section className="rm-filter-group-card">
      <div className="rm-filter-group-header">
        <h3>{title}</h3>
        <button
          type="button"
          className="rm-filter-inline-button"
          onClick={onClear}
          disabled={!selectedValues.length}
        >
          Any
        </button>
      </div>

      {helper ? <p className="rm-filter-group-helper">{helper}</p> : null}

      <div className="rm-filter-facet-list">
        {options.length ? (
          options.map((option) => (
            <label key={option.value} className="rm-filter-facet-item">
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => onToggle(option.value)}
              />
              <span>{option.label}</span>
              {typeof option.count === 'number' ? (
                <span className="rm-filter-facet-count">{option.count}</span>
              ) : null}
            </label>
          ))
        ) : (
          <p className="rm-filter-facet-empty">No values</p>
        )}
      </div>
    </section>
  )
}

export default RMFilterFacetGroup
