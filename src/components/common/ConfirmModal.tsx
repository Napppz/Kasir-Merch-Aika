import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 1200 }}>
      <div
        className="checkout-modal-card"
        style={{
          width: '440px',
          padding: '24px',
          background: '#0f172a',
          border: '1px solid var(--border-muted)',
          borderRadius: 'var(--radius-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: isDestructive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDestructive ? '#f87171' : 'var(--primary-light)',
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>{title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            style={{ color: 'var(--text-dim)', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="modal-cancel-btn"
            onClick={onCancel}
            style={{ padding: '8px 16px' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-md)',
              background: isDestructive ? '#ef4444' : '#6366f1',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: isDestructive ? '0 0 15px rgba(239, 68, 68, 0.4)' : '0 0 15px var(--primary-glow)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
