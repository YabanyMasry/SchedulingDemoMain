import { useMemo, useState } from 'react'
import { matchesByMode, normalize, toggleFromArray } from './rmFiltering'

// UUIDs are internal IDs and carry no meaning to users — skip them during text search
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Shared filter hook for RM entity pages.
 *
 * @param {object[]} data           - Source rows (already resolved — no raw GUIDs).
 * @param {object[]} facetConfig    - MUST be a stable reference (module-level const or useMemo).
 *   Each entry: { key, title, helper?, getValue(row)→scalar|array, isMultiValue? }
 *
 * Search is always fuzzy across all non-UUID string fields.
 * Multi-value facets (isMultiValue: true) filter when ANY selected value appears in the row's array.
 */
export const useRMFilters = (data, facetConfig) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Initialise one selected-values array per facet, keyed by facet.key
  const [selections, setSelections] = useState(() =>
    Object.fromEntries(facetConfig.map((f) => [f.key, []])),
  )

  // Build option lists from the full unfiltered dataset so counts reflect the total
  // available values, not just what survives the current filter combination
  const facetOptions = useMemo(() => {
    const result = {}
    for (const facet of facetConfig) {
      const counts = new Map()
      for (const row of data) {
        const raw = facet.getValue(row)
        // Multi-value facets supply an array; scalar facets are wrapped in a one-element array
        const vals = facet.isMultiValue ? (raw ?? []) : raw != null ? [raw] : []
        for (const v of vals) {
          if (v == null || v === '' || v === '—') continue
          counts.set(String(v), (counts.get(String(v)) ?? 0) + 1)
        }
      }
      result[facet.key] = [...counts.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([value, count]) => ({ value, label: value, count }))
    }
    return result
  }, [data, facetConfig])

  const filteredData = useMemo(() => {
    const normalizedQuery = normalize(searchQuery)
    return data.filter((row) => {
      // Apply facet filters first — they are O(1) set lookups and cheap to fail fast
      for (const facet of facetConfig) {
        const selected = selections[facet.key]
        if (!selected?.length) continue
        const raw = facet.getValue(row)
        if (facet.isMultiValue) {
          // Multi-value: row passes if ANY of its values match ANY selected filter value
          const rowVals = raw ?? []
          if (!selected.some((s) => rowVals.includes(s))) return false
        } else {
          // Scalar: row passes only if its value is in the selected set
          if (!selected.includes(raw)) return false
        }
      }
      if (!normalizedQuery) return true
      // Text search: match if any non-UUID, non-boolean field value fuzzy-matches the query
      return Object.values(row).some((v) => {
        if (v == null) return false
        const str = String(v)
        if (UUID_RE.test(str)) return false
        if (typeof v === 'boolean') return false
        return matchesByMode(str, normalizedQuery, 'fuzzy')
      })
    })
  }, [data, facetConfig, searchQuery, selections])

  const toggleFacet = (key, value) =>
    setSelections((prev) => ({
      ...prev,
      [key]: toggleFromArray(prev[key] ?? [], value),
    }))

  const clearFacet = (key) =>
    setSelections((prev) => ({ ...prev, [key]: [] }))

  const clearAll = () => {
    setSearchQuery('')
    setSelections(Object.fromEntries(facetConfig.map((f) => [f.key, []])))
  }

  // Merge facet config metadata with live state so consumers get a single cohesive object per facet
  const facets = facetConfig.map((f) => ({
    key: f.key,
    title: f.title,
    helper: f.helper ?? '',
    options: facetOptions[f.key] ?? [],
    selectedValues: selections[f.key] ?? [],
    onToggle: (value) => toggleFacet(f.key, value),
    onClear: () => clearFacet(f.key),
  }))

  // Produces a flat chip list representing every active filter (search query + all facet
  // selections) so the filter summary bar can render and remove individual constraints
  const activeFilterChips = useMemo(() => {
    const chips = []
    if (normalize(searchQuery)) {
      chips.push({
        key: 'q',
        label: `Search: ${normalize(searchQuery)}`,
        onRemove: () => setSearchQuery(''),
      })
    }
    for (const facet of facetConfig) {
      for (const value of selections[facet.key] ?? []) {
        chips.push({
          key: `${facet.key}:${value}`,
          label: `${facet.title}: ${value}`,
          onRemove: () => toggleFacet(facet.key, value),
        })
      }
    }
    return chips
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, facetConfig, selections])

  return {
    filteredData,
    searchQuery,
    setSearchQuery,
    isFilterOpen,
    toggleFilterPanel: () => setIsFilterOpen((v) => !v),
    activeFilterCount: activeFilterChips.length,
    activeFilterChips,
    facets,
    clearAll,
  }
}
