import React, { useState } from 'react';
import { Download, ShieldCheck, Loader2, CheckCircle } from 'lucide-react';
import { backupService } from '../../services/backupService';

interface BackupActionCardProps {
  onBackupSuccess: () => void;
  onError: (msg: string) => void;
  onSuccessToast: (msg: string) => void;
}

export const BackupActionCard: React.FC<BackupActionCardProps> = ({
  onBackupSuccess,
  onError,
  onSuccessToast,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleBackupNow = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      // 1. Generate full backup object
      const backupFile = await backupService.createBackup();

      // 2. Trigger browser download
      const { filename } = await backupService.downloadBackup(backupFile, 'Backup');

      // 3. Inform user & trigger refresh of stats & last backup
      onSuccessToast(`File cadangan "${filename}" berhasil diunduh.`);
      onBackupSuccess();
    } catch (err: any) {
      console.error('Backup error:', err);
      onError(err?.message || 'Gagal membuat file cadangan database.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={20} color="var(--primary-light)" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Pencadangan Database Penuh
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Simpan seluruh data ke file JSON mandiri
            </span>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '8px 0 12px 0' }}>
          Cadangkan seluruh data terminal booth: <strong>katalog produk, kategori, riwayat transaksi kasir, log pergerakan stok, dan sesi stock opname</strong>. File cadangan dilengkapi verifikasi integritas SHA-256 untuk keamanan data saat event cosplay.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--cyan)', background: 'rgba(6, 182, 212, 0.1)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
            <CheckCircle size={11} /> Format JSON Valid
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#34d399', background: 'rgba(52, 211, 153, 0.1)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
            <CheckCircle size={11} /> 100% Offline
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--pink)', background: 'rgba(236, 72, 153, 0.1)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
            <CheckCircle size={11} /> Checksum Terverifikasi
          </span>
        </div>
      </div>

      <button
        id="btn-backup-now"
        onClick={handleBackupNow}
        disabled={isExporting}
        style={{
          background: isExporting
            ? 'rgba(139, 92, 246, 0.3)'
            : 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 20px',
          fontWeight: 800,
          fontSize: '13px',
          cursor: isExporting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 4px 15px rgba(124, 58, 237, 0.35)',
          transition: 'all 0.2s ease',
        }}
      >
        {isExporting ? (
          <>
            <Loader2 size={16} className="spinning" />
            <span>Mengekspor & Menyusun Data...</span>
          </>
        ) : (
          <>
            <Download size={16} />
            <span>Backup Sekarang</span>
          </>
        )}
      </button>
    </div>
  );
};
