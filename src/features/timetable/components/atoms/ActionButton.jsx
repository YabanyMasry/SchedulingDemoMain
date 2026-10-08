const ActionButton = ({ icon: Icon, title, onClick, variant = 'default', style = {} }) => {
  const isDelete = variant === 'delete'
  return (
    <button 
      type="button" 
      className="icon-button" 
      title={title} 
      onClick={onClick}
      style={{ 
        color: isDelete ? '#ef4444' : 'var(--text-soft)',
        ...style 
      }}
    >
      <Icon size={18} />
    </button>
  )
}

export default ActionButton
