import React from 'react';
import { History, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import type { LastBackupInfo } from '../../types';
import { formatBytes, formatBackupDate } from '../../services/backupService';

interface LastBackupCardProps {
  lastBackup: LastBackupInfo | null;
}

export const LastBackupCard: React.FC<LastBackupCardProps> = ({ lastBackup }) => {
  const hasBackup = lastBackup !== null;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(236, 72, 153, 0.12)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <History size={20} color="var(--pink)" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Backup Terakhir
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Riwayat cadangan data lokal booth
            </span>
          </div>
        </div>

        {/* Status Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            background: hasBackup ? 'rgba(52, 211, 153, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: `1px solid ${hasBackup ? 'rgba(52, 211, 153, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
            color: hasBackup ? '#34d399' : '#f59e0b',
          }}
        >
          {hasBackup ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
          <span>{hasBackup ? 'Backup Berhasil' : 'Belum Ada Backup'}</span>
        </div>
      </div>

      {hasBackup ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Waktu Pencadangan</span>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                {formatBackupDate(lastBackup.timestamp)}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Ukuran Berkas</span>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--cyan)' }}>
                {formatBytes(lastBackup.sizeBytes)}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Total Data</span>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399' }}>
                {lastBackup.recordCount} records
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              background: 'var(--bg-surface)',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <FileText size={13} color="var(--pink)" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {lastBackup.filename}
            </span>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '16px',
            borderRadius: '8px',
            border: '1px dashed var(--border-subtle)',
            textAlign: 'center',
            color: 'var(--text-dim)',
            fontSize: '12px',
          }}
        >
          Belum pernah dilakukan pencadangan pada perangkat ini. Sangat disarankan untuk membuat file cadangan secara berkala selama event cosplay berlangsung.
        </div>
      )}
    </div>
  );
};
