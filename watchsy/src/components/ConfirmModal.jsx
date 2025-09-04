import React from 'react';

export default function ConfirmModal({ open, title = 'Are you sure?', description, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={styles.backdrop} role="dialog" aria-modal>
      <div style={styles.modal}>
        <div style={styles.header}>{title}</div>
        {description ? <div style={styles.body}>{description}</div> : null}
        <div style={styles.actions}>
          <button style={styles.cancel} onClick={onCancel}>{cancelText}</button>
          <button style={styles.confirm} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
  },
  modal: {
    width: 360, maxWidth: '90%', background: '#232b3b', color: '#f5f6fa', borderRadius: 16, boxShadow: '0 12px 32px rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.08)'
  },
  header: {
    padding: '16px 18px', fontSize: 18, fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)'
  },
  body: {
    padding: '14px 18px', fontSize: 14, color: '#b8c5d6'
  },
  actions: {
    display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '14px 18px'
  },
  cancel: {
    padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', color: '#f5f6fa', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer'
  },
  confirm: {
    padding: '10px 14px', borderRadius: 10, background: 'linear-gradient(45deg, #ff6b6b, #ff8e8e)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 6px 18px rgba(255, 107, 107, 0.35)'
  }
}; 