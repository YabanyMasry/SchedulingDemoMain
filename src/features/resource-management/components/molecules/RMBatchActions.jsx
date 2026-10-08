import { IconCircleCheck, IconTrash, IconTrashX } from '@tabler/icons-react'

const RMBatchActions = ({ count, onActivate, onDeactivate, onHardDelete, onClear }) => {
  const active = count > 0

  return (
    <div className="rm-batch-actions-row">
      <span className="rm-batch-selected-count" style={{ color: active ? 'var(--brand)' : 'var(--text-soft)' }}>
        {active ? `${count} Selected` : 'Select items'}
      </span>

      <button
        type="button"
        className="rm-batch-action-btn rm-batch-activate"
        onClick={onActivate}
        disabled={!active}
        title="Activate selected"
      >
        <IconCircleCheck size={15} />
        <span className="rm-batch-action-label">Activate</span>
      </button>

      <button
        type="button"
        className="rm-batch-action-btn rm-batch-deactivate"
        onClick={onDeactivate}
        disabled={!active}
        title="Deactivate selected"
      >
        <IconTrash size={15} />
        <span className="rm-batch-action-label">Deactivate</span>
      </button>

      <button
        type="button"
        className="rm-batch-action-btn rm-batch-hard-delete"
        onClick={onHardDelete}
        disabled={!active}
        title="Permanently delete selected"
      >
        <IconTrashX size={15} />
        <span className="rm-batch-action-label">Delete</span>
      </button>

      <button
        type="button"
        className="rm-batch-cancel-button"
        onClick={onClear}
        disabled={!active}
      >
        Cancel
      </button>
    </div>
  )
}

export default RMBatchActions
