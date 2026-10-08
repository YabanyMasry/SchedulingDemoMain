import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { IconX } from '@tabler/icons-react'
import './EntityFormModal.css'

const EntityFormModal = ({
  title,
  onClose,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Save',
  children,
}) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return createPortal(
    <div className="efm-overlay" onMouseDown={handleOverlayMouseDown}>
      <div className="efm-modal" role="dialog" aria-modal="true" aria-labelledby="efm-title">
        <div className="efm-header">
          <h2 className="efm-title" id="efm-title">{title}</h2>
          <button type="button" className="efm-close" onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </button>
        </div>
        <form className="efm-form" onSubmit={onSubmit}>
          <div className="efm-body">
            {children}
          </div>
          <div className="efm-footer">
            <button type="button" className="efm-btn efm-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="efm-btn efm-btn-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

export default EntityFormModal
