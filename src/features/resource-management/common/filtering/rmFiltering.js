// Ensures every row has a stable string __rowId for selection tracking.
// Falls back to a scope-prefixed index when neither id nor Id exists on the row.
export const withStableRowIds = (rows, scope = 'rm-row') =>
  rows.map((row, index) => ({
    ...row,
    __rowId: String(row.id ?? row.Id ?? row.__rowId ?? `${scope}-${index}`),
  }))

// Coerces null/undefined to an empty string before trimming so downstream comparisons
// are always operating on plain strings
export const normalize = (value) => String(value ?? '').trim()

// Returns true if every character in query appears in text in the same relative order.
// Allows "tc" to match "teacher" — useful as a fallback tier in fuzzy search.
const isSubsequence = (query, text) => {
  let queryIndex = 0

  for (let index = 0; index < text.length && queryIndex < query.length; index += 1) {
    if (text[index] === query[queryIndex]) {
      queryIndex += 1
    }
  }

  return queryIndex === query.length
}

// Three-tier match: exact substring → all space-separated terms present → subsequence match.
// Each tier is progressively more lenient so users get intuitive results at every specificity level.
const fuzzyMatch = (value, query) => {
  const normalizedValue = normalize(value).toLowerCase()
  const normalizedQuery = normalize(query).toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  if (normalizedValue.includes(normalizedQuery)) {
    return true
  }

  const terms = normalizedQuery.split(/\s+/).filter(Boolean)

  return terms.every(
    (term) => normalizedValue.includes(term) || isSubsequence(term, normalizedValue),
  )
}

// Dispatches to the correct comparison strategy based on the requested mode.
// Defaults to case-insensitive substring ('includesString') when no mode is specified.
export const matchesByMode = (value, query, mode) => {
  const rawValue = normalize(value)
  const rawQuery = normalize(query)

  if (!rawQuery) {
    return true
  }

  const valueLower = rawValue.toLowerCase()
  const queryLower = rawQuery.toLowerCase()

  switch (mode) {
    case 'includesStringSensitive':
      return rawValue.includes(rawQuery)
    case 'equalsString':
      return valueLower === queryLower
    case 'equalsStringSensitive':
      return rawValue === rawQuery
    case 'startsWith':
      return valueLower.startsWith(queryLower)
    case 'fuzzy':
      return fuzzyMatch(rawValue, rawQuery)
    case 'includesString':
    default:
      return valueLower.includes(queryLower)
  }
}

// Removes the value if already selected, appends it if not — standard multi-select toggle
export const toggleFromArray = (items, value) =>
  items.includes(value)
    ? items.filter((item) => item !== value)
    : [...items, value]

// Appends T00:00:00 before parsing to force local midnight rather than UTC midnight,
// preventing the date from rolling back a day in negative-UTC-offset timezones
export const toDateStamp = (value) => {
  if (!value) {
    return null
  }

  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime()
}

// Counts unique normalized values for a given field key and returns them sorted
// alphabetically with their occurrence count for display in filter panels
export const getFacetOptions = (rows, key) => {
  const counts = new Map()

  rows.forEach((row) => {
    const value = normalize(row[key])

    if (!value) {
      return
    }

    counts.set(value, (counts.get(value) ?? 0) + 1)
  })

  return Array.from(counts.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([value, count]) => ({ value, label: value, count }))
}

// Same as getFacetOptions but flattens the array-valued `tags` field across all rows
// before counting, since each row can have multiple tags
export const getTagFacetOptions = (rows) => {
  const counts = new Map()

  rows.forEach((row) => {
    ;(row.tags ?? []).forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    })
  })

  return Array.from(counts.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([value, count]) => ({ value, label: value, count }))
}
