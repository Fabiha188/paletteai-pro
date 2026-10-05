import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

// Generic yes/no dialog. Rendered through a portal so it always sits above the
// page, even when opened from inside the (blurred, sticky) navbar.
export default function ConfirmModal({
  isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  icon = 'fa-circle-question', onConfirm, onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return createPortal(
    <div className="modal-overlay show" onClick={onCancel}>
      <div
        className="modal-box confirm-box" role="alertdialog" aria-modal="true"
        aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-icon"><i className={`fas ${icon}`}></i></div>
        <h3 id="confirm-title">{title}</h3>
        <p className="confirm-msg">{message}</p>
        <div className="confirm-actions">
          <button type="button" className="confirm-cancel" onClick={onCancel} autoFocus>
            {cancelLabel}
          </button>
          <button type="button" className="confirm-ok" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
