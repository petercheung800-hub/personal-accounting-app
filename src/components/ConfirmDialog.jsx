import React, { useEffect, useRef } from 'react';

const ConfirmDialog = ({
  open,
  title = '确认操作',
  message = '确定要继续吗？',
  confirmText = '确认',
  cancelText = '取消',
  danger = false,
  closeOnOverlay = true,
  onConfirm,
  onCancel,
}) => {
  const confirmBtnRef = useRef(null);
  useEffect(() => {
    if (open) {
      setTimeout(() => confirmBtnRef.current?.focus(), 0);
    }
  }, [open]);
  if (!open) return null;
  return (
    <div className="confirm-modal-backdrop" role="presentation" onClick={closeOnOverlay ? onCancel : undefined}>
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            onCancel?.();
          }
          if (e.key === 'Enter') {
            e.stopPropagation();
            onConfirm?.();
          }
        }}
      >
        <h3 id="confirm-title" className={`confirm-title${danger ? ' danger' : ''}`}>{title}</h3>
        <p id="confirm-message" className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button type="button" className="cancel-btn" onClick={onCancel} aria-label="取消">{cancelText}</button>
          <button
            type="button"
            className="delete-btn"
            onClick={onConfirm}
            aria-label={danger ? '确认删除' : '确认'}
            ref={confirmBtnRef}
          >
            {danger ? '🗑️ ' : '✔️ '}{confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;