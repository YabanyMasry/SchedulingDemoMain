import { statusColor } from '../lib/constants'

// Pill badge for a coverage / absence status. Colour is derived from the status name so the
// same component renders absence statuses and per-lesson coverage statuses consistently.
const StatusBadge = ({ status }) => {
  const color = statusColor(status)
  return (
    <span
      style={{
        background: color + '22',
        color,
        borderRadius: 999,
        padding: '2px 10px',
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  )
}

export default StatusBadge
