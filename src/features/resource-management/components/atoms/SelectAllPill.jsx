const SelectAllPill = ({
  checked,
  onToggle,
  label = 'All',
}) => {
  return (
    <button
      type="button"
      className="rm-select-all-group"
      onClick={onToggle}
      aria-pressed={checked}
      aria-label="Toggle all rows"
    >
      <input
        type="checkbox"
        className="card-checkbox"
        style={{ position: 'static', margin: 0 }}
        checked={checked}
        readOnly
      />
      <span style={{ fontSize: '14px', color: 'var(--text-soft)', fontWeight: 500 }}>
        {label}
      </span>
    </button>
  )
}

export default SelectAllPill
