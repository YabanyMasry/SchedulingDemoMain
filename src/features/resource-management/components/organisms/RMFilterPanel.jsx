import { useEffect, useMemo, useState } from 'react'
import './RMFilterPanel.css'

const normalizeText = (value) => String(value ?? '').trim().toLowerCase()

const RMFilterPanel = ({
  isOpen,
  activeFilterCount,
  resultCount,
  onClearAll,
  facets = [],
  activeFilterChips = [],
}) => {
  const [activeFacetKey, setActiveFacetKey] = useState('')
  const [fieldQuery, setFieldQuery] = useState('')
  const [valueQuery, setValueQuery] = useState('')

  const visibleFacets = useMemo(() => {
    const normalizedFieldQuery = normalizeText(fieldQuery)
    if (!normalizedFieldQuery) return facets
    return facets.filter((facet) => {
      const title = normalizeText(facet.title)
      const helper = normalizeText(facet.helper)
      return title.includes(normalizedFieldQuery) || helper.includes(normalizedFieldQuery)
    })
  }, [facets, fieldQuery])

  const activeFacet = useMemo(() => {
    if (!facets.length) return null
    return (
      visibleFacets.find((facet) => facet.key === activeFacetKey) ||
      facets.find((facet) => facet.key === activeFacetKey) ||
      visibleFacets[0] ||
      facets[0]
    )
  }, [activeFacetKey, facets, visibleFacets])

  const filteredActiveFacetOptions = useMemo(() => {
    if (!activeFacet) return []
    const normalizedValueQuery = normalizeText(valueQuery)
    if (!normalizedValueQuery) return activeFacet.options
    return activeFacet.options.filter((option) =>
      normalizeText(option.label ?? option.value).includes(normalizedValueQuery),
    )
  }, [activeFacet, valueQuery])

  const activeFacetSelectionCount = activeFacet?.selectedValues?.length ?? 0

  const facetsWithSelections = useMemo(
    () => facets.filter((facet) => (facet.selectedValues?.length ?? 0) > 0).length,
    [facets],
  )

  useEffect(() => {
    if (!facets.length) {
      setActiveFacetKey('')
      return
    }
    const hasSelectedFacet = facets.some((facet) => facet.key === activeFacetKey)
    if (!hasSelectedFacet) setActiveFacetKey(facets[0].key)
  }, [activeFacetKey, facets])

  useEffect(() => {
    if (activeFacet && activeFacet.key !== activeFacetKey) {
      setActiveFacetKey(activeFacet.key)
    }
  }, [activeFacet, activeFacetKey])

  if (!isOpen) return null

  return (
    <section className="rm-test-filter-panel">
      <div className="rm-test-filter-panel-header">
        <div>
          <h2 className="card-title">Filters</h2>
          <p className="card-subtitle">Select facets to narrow results. Search uses fuzzy matching.</p>
        </div>
        <button
          type="button"
          className="pill-button rm-filter-clear-button"
          onClick={onClearAll}
          disabled={activeFilterCount === 0}
        >
          {`Clear all (${activeFilterCount})`}
        </button>
      </div>

      <div className="rm-filter-status-row">
        <span>{`Active filters: ${activeFilterCount}`}</span>
        <span>{`Results: ${resultCount}`}</span>
        <span>{`Fields in use: ${facetsWithSelections}/${facets.length}`}</span>
      </div>

      <div className="rm-filter-workspace">
        <section className="rm-filter-field-panel" aria-label="Filter fields">
          <div className="rm-filter-field-toolbar">
            <span className="rm-filter-label">Filter by field</span>
            <input
              className="rm-filter-control rm-filter-field-search"
              value={fieldQuery}
              onChange={(event) => setFieldQuery(event.target.value)}
              placeholder="Search fields..."
              aria-label="Search filter fields"
            />
          </div>

          <div className="rm-filter-field-grid" role="tablist" aria-label="Available filter fields">
            {visibleFacets.length ? (
              visibleFacets.map((facet) => {
                const facetSelectionCount = facet.selectedValues?.length ?? 0
                const isActive = facet.key === activeFacet?.key
                return (
                  <button
                    key={facet.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`rm-filter-field-chip ${isActive ? 'rm-filter-field-chip-active' : ''}`}
                    onClick={() => {
                      setActiveFacetKey(facet.key)
                      setValueQuery('')
                    }}
                  >
                    <span className="rm-filter-field-chip-title">{facet.title}</span>
                    <span
                      className={`rm-filter-field-chip-count ${facetSelectionCount ? 'rm-filter-field-chip-count-active' : ''}`}
                    >
                      {facetSelectionCount}
                    </span>
                  </button>
                )
              })
            ) : (
              <p className="rm-filter-empty-state">No fields match your search.</p>
            )}
          </div>
        </section>

        <section className="rm-filter-focus-card" aria-label="Filter values">
          {activeFacet ? (
            <>
              <div className="rm-filter-focus-header">
                <div>
                  <h3>{activeFacet.title}</h3>
                  {activeFacet.helper ? (
                    <p className="rm-filter-group-helper">{activeFacet.helper}</p>
                  ) : null}
                  <p className="rm-filter-focus-meta">{`Selected: ${activeFacetSelectionCount}`}</p>
                </div>
                <button
                  type="button"
                  className="rm-filter-inline-button"
                  onClick={activeFacet.onClear}
                  disabled={!activeFacetSelectionCount}
                >
                  Clear field
                </button>
              </div>

              <div className="rm-filter-option-toolbar">
                <input
                  className="rm-filter-control rm-filter-option-search"
                  value={valueQuery}
                  onChange={(event) => setValueQuery(event.target.value)}
                  placeholder={`Search ${activeFacet.title.toLowerCase()} values...`}
                  aria-label={`Search ${activeFacet.title} values`}
                />
              </div>

              <div className="rm-filter-facet-list">
                {filteredActiveFacetOptions.length ? (
                  filteredActiveFacetOptions.map((option) => (
                    <label key={option.value} className="rm-filter-facet-item">
                      <input
                        type="checkbox"
                        checked={activeFacet.selectedValues.includes(option.value)}
                        onChange={() => activeFacet.onToggle(option.value)}
                      />
                      <span>{option.label}</span>
                      {typeof option.count === 'number' ? (
                        <span className="rm-filter-facet-count">{option.count}</span>
                      ) : null}
                    </label>
                  ))
                ) : (
                  <p className="rm-filter-facet-empty">No values match your search.</p>
                )}
              </div>
            </>
          ) : (
            <p className="rm-filter-empty-state">No filter fields are available.</p>
          )}
        </section>
      </div>

      <div className="rm-filter-chip-row">
        {activeFilterCount ? (
          activeFilterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className="rm-filter-chip"
              onClick={chip.onRemove}
            >
              <span>{chip.label}</span>
              <span aria-hidden="true">×</span>
            </button>
          ))
        ) : (
          <p className="rm-filter-empty-state">No active filters.</p>
        )}
      </div>
    </section>
  )
}

export default RMFilterPanel
