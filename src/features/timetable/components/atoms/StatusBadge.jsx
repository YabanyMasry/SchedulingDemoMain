const StatusBadge = ({ status }) => {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      {status}
    </span>
  )
}

export default StatusBadge
