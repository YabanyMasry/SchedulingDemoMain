import { IconTrash, IconBoxMultiple } from '@tabler/icons-react'

const BatchActions = ({ count, onDelete, onCompare, onClear }) => {

  return (
    <div className="batch-actions-row">
      <span
        className="batch-selected-count"
        style={{ fontSize: '14px', fontWeight: 600, color: count > 0 ? 'var(--brand)' : 'var(--text-soft)' }}
      >
        {count > 0 ? `${count} Selected` : 'Select items'}
      </span>
      
      <button 
        type="button" 
        className="pill-button batch-action-button" 
        onClick={onCompare}
        disabled={count !== 2}
        style={{ 
          background: count === 2 ? 'var(--brand-tint)' : 'transparent',
          color: count === 2 ? 'var(--brand)' : 'var(--text-soft)', 
          border: '1px solid var(--border)',
          opacity: count === 2 ? 1 : 0.5,
          cursor: count === 2 ? 'pointer' : 'not-allowed'
        }}
        title={count !== 2 ? 'Select exactly 2 timetables to compare' : 'Compare selected timetables'}
      >
        <IconBoxMultiple size={18} />
        <span className="batch-action-label">Compare</span>
      </button>

      <button 
        type="button" 
        className="pill-button batch-action-button" 
        onClick={onDelete}
        disabled={count === 0}
        style={{ 
          background: count > 0 ? '#fee2e2' : 'transparent', 
          color: count > 0 ? '#ef4444' : 'var(--text-soft)', 
          borderColor: count > 0 ? '#fee2e2' : 'var(--border)',
          opacity: count > 0 ? 1 : 0.5,
          cursor: count > 0 ? 'pointer' : 'not-allowed'
        }}
      >
        <IconTrash size={18} />
        <span className="batch-action-label">Delete</span>
      </button>
      
      <button 
        type="button" 
        className="batch-cancel-button"
        onClick={onClear} 
        disabled={count === 0}
        style={{ 
          background: 'none', 
          border: 'none', 
          color: count > 0 ? 'var(--text-soft)' : '#cbd5e0', 
          cursor: count > 0 ? 'pointer' : 'not-allowed', 
          fontSize: '14px',
          opacity: count > 0 ? 1 : 0.7
        }}
      >
        Cancel
      </button>
    </div>
  )
}

export default BatchActions
