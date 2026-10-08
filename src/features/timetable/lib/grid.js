// Shared timetable-grid look, used by both the admin editor grid (TimetableEditorPage) and the
// read-only schedule grid teachers/students see (TimetableReadGrid). Centralised so the two views
// stay visually identical — the read grid should match what the admin sees after generation.

export const SLOT_PALETTE = [
  { bg: '#eef4ff', edge: '#3b82f6', text: '#1e40af' }, // blue
  { bg: '#ecfdf5', edge: '#10b981', text: '#065f46' }, // emerald
  { bg: '#fdf2f8', edge: '#ec4899', text: '#9d174d' }, // pink
  { bg: '#f5f3ff', edge: '#8b5cf6', text: '#5b21b6' }, // violet
  { bg: '#fffbeb', edge: '#f59e0b', text: '#92400e' }, // amber
  { bg: '#f0fdfa', edge: '#14b8a6', text: '#115e59' }, // teal
  { bg: '#fef2f2', edge: '#ef4444', text: '#991b1b' }, // red
  { bg: '#f7fee7', edge: '#84cc16', text: '#3f6212' }, // lime
]

// Stable per-subject colour so the same subject always reads the same across views.
export const paletteFor = (name) => {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return SLOT_PALETTE[h % SLOT_PALETTE.length]
}

// ── grid styles (match the editor grid) ──
export const gCard = {
  background: 'var(--surface, #fff)',
  border: '1px solid var(--border, #eceef2)',
  borderRadius: 14,
  boxShadow: 'var(--shadow-soft, 0px 4px 20px rgba(0,0,0,0.05))',
  overflow: 'hidden',
}
export const gScroll = { overflow: 'auto' }
export const gTable = { width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 760 }
export const gThCell = {
  textAlign: 'center', padding: '12px 12px', fontSize: 12, fontWeight: 700,
  color: 'var(--text-soft, #9ca3af)', textTransform: 'uppercase', letterSpacing: 0.6,
  borderBottom: '1px solid var(--border, #eceef2)', background: '#f6f8fa',
}
export const gThSticky = { position: 'sticky', top: 0, zIndex: 2 }
export const gThCorner = { position: 'sticky', top: 0, left: 0, zIndex: 3, textAlign: 'left' }
export const gPeriodCell = {
  position: 'sticky', left: 0, zIndex: 1,
  padding: '10px 12px', borderBottom: '1px solid var(--border, #eceef2)',
  borderRight: '1px solid var(--border, #eceef2)', whiteSpace: 'nowrap',
  verticalAlign: 'top', background: '#f6f8fa', textAlign: 'center',
}
export const gPeriodBadge = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 26, height: 26, borderRadius: 8, fontSize: 13, fontWeight: 700,
  color: 'var(--text-h, #1a1a1a)', background: 'var(--surface, #fff)',
  border: '1px solid var(--border, #eceef2)',
}
export const gCell = {
  padding: 6, borderBottom: '1px solid var(--border, #eceef2)',
  borderRight: '1px solid var(--border, #eceef2)', verticalAlign: 'top',
  minWidth: 136, height: 72, textAlign: 'left',
}
export const gSlotCard = {
  borderRadius: 8, padding: '6px 8px', marginBottom: 4,
  border: '1px solid transparent', textAlign: 'left',
}
export const gMeta = { fontSize: 11, color: 'var(--text-soft, #666)', overflow: 'hidden', textOverflow: 'ellipsis' }
export const gMetaRoom = { fontSize: 11, fontWeight: 600, color: 'var(--text, #717171)' }
