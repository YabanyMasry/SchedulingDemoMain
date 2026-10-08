import TimetableCard from './TimetableCard'

const TimetableGrid = ({ 
  items, 
  selectedIds, 
  onToggle, 
  onEdit, 
  onDelete 
}) => {
  return (
    <div className="timetable-grid">
      {items.map((tt) => (
        <TimetableCard 
          key={tt.id}
          item={tt}
          isSelected={selectedIds.includes(tt.id)}
          onToggle={() => onToggle(tt.id)}
          onEdit={() => onEdit(tt.id)}
          onDelete={() => onDelete(tt.id)}
        />
      ))}
    </div>
  )
}

export default TimetableGrid
