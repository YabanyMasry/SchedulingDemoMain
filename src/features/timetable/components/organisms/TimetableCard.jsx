import { IconEdit, IconTrash } from '@tabler/icons-react'
import StatusBadge from '../atoms/StatusBadge'
import ActionButton from '../atoms/ActionButton'
import './TimetableCard.css'

const TimetableCard = ({ 
  item, 
  isSelected, 
  onToggle, 
  onEdit, 
  onDelete 
}) => {
  return (
    <div className={`timetable-card ${isSelected ? 'selected' : ''}`}>
      <input 
        type="checkbox" 
        className="card-checkbox" 
        checked={isSelected}
        onChange={onToggle}
      />
      
      <div className="card-content">
        <StatusBadge status={item.status} />
        <h3 style={{ marginTop: '12px' }}>{item.title}</h3>
        <p>{item.description}</p>
      </div>

      <div className="card-footer" style={{ flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-soft)' }}>
          Updated {item.updatedAt}
        </span>
        <div className="card-actions">
          <ActionButton 
            icon={IconEdit} 
            title="Edit" 
            onClick={onEdit} 
          />
          <ActionButton 
            icon={IconTrash} 
            title="Delete" 
            variant="delete" 
            onClick={onDelete} 
          />
        </div>
      </div>
    </div>
  )
}

export default TimetableCard
