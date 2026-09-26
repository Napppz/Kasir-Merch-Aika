import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '46px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 2000,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';

        return (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              background: '#0f172a',
              border: `1px solid ${
                isSuccess
                  ? 'rgba(16, 185, 129, 0.4)'
                  : isError
                  ? 'rgba(239, 68, 68, 0.4)'
                  : 'rgba(99, 102, 241, 0.4)'
              }`,
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              minWidth: '260px',
              maxWidth: '380px',
              animation: 'fadeInUp 200ms ease-out',
            }}
          >
            {isSuccess && <CheckCircle size={16} color="#34d399" />}
            {isError && <AlertCircle size={16} color="#f87171" />}
            {!isSuccess && !isError && <Info size={16} color="var(--primary-light)" />}
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              style={{ color: 'var(--text-dim)', padding: '2px' }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
