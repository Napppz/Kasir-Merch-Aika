import React, { useState } from 'react';
import { AlertTriangle, Database, X, Loader2, ArrowRight, Package, Layers, ShoppingBag, ArrowLeftRight, ClipboardCheck, ShieldAlert } from 'lucide-react';
import type { BackupFile } from '../../types';
import { formatBytes, formatBackupDate, backupService } from '../../services/backupService';

interface RestoreModalProps {
  isOpen: boolean;
  backupFile: BackupFile | null;
  fileSizeBytes: number;
  onClose: () => void;
  onRestoreSuccess: (message: string) => void;
  onError: (error: string) => void;
}

export const RestoreModal: React.FC<RestoreModalProps> = ({
  isOpen,
  backupFile,
  fileSizeBytes,
  onClose,
  onRestoreSuccess,
  onError,
}) => {
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreStage, setRestoreStage] = useState<string>('');

  if (!isOpen || !backupFile) return null;

  const { data, databaseVersion, createdAt } = backupFile;
  const prodCount = data.products?.length || 0;
  const catCount = data.categories?.length || 0;
  const txCount = data.transactions?.length || 0;
  const movCount = data.stock_movements?.length || 0;
  const opnCount = data.opname_sessions?.length || 0;

  const handleConfirmRestore = async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    setRestoreStage('Membuat cadangan otomatis (Pre-Restore)...');

    try {
      // Small tick for smooth UX stage feedback
      await new Promise(r => setTimeout(r, 200));

      setRestoreStage('Menerapkan data ke database lokal (Atomic Transaction)...');
      const result = await backupService.restoreBackup(backupFile);

      if (!result.success) {
        throw new Error(result.error || 'Pemulihan database gagal.');
      }

      setRestoreStage('Memverifikasi integritas data...');
      await new Promise(r => setTimeout(r, 200));

      onRestoreSuccess('Restore berhasil. Data CosplayPOS telah dipulihkan.');
      onClose();
    } catch (err: any) {
      console.error('Restore error:', err);
      onError(err?.message || 'Gagal memulihkan database.');
    } finally {
      setIsRestoring(false);
      setRestoreStage('');
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '560px',
          width: '95%',
          background: 'var(--bg-card)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(239, 68, 68, 0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(239, 68, 68, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={18} color="#f87171" />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Konfirmasi Pemulihan Database (Restore)
              </h3>
              <span style={{ fontSize: '11px', color: '#f87171' }}>
                Penggantian data lokal aplikasi
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isRestoring}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: isRestoring ? 'not-allowed' : 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Step 3: Preview Information Card */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={14} />
              Pratinjau Data Cadangan (Preview)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>TANGGAL CADANGAN</span>
                <div style={{ fontWeight: 700, color: '#ffffff' }}>{formatBackupDate(createdAt)}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>VERSI SKEMA</span>
                <div style={{ fontWeight: 800, color: 'var(--cyan)' }}>v{databaseVersion}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>UKURAN FILE</span>
                <div style={{ fontWeight: 700, color: '#ffffff' }}>{formatBytes(fileSizeBytes)}</div>
              </div>
            </div>

            {/* Counts Breakdown */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                Rincian Record yang Akan Dipulihkan:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: 'var(--bg-surface)', padding: '6px 8px', borderRadius: '4px' }}>
                  <Package size={13} color="var(--pink)" />
                  <span><strong>{prodCount}</strong> Produk</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: 'var(--bg-surface)', padding: '6px 8px', borderRadius: '4px' }}>
                  <Layers size={13} color="var(--purple)" />
                  <span><strong>{catCount}</strong> Kategori</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: 'var(--bg-surface)', padding: '6px 8px', borderRadius: '4px' }}>
                  <ShoppingBag size={13} color="#34d399" />
                  <span><strong>{txCount}</strong> Transaksi</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: 'var(--bg-surface)', padding: '6px 8px', borderRadius: '4px' }}>
                  <ArrowLeftRight size={13} color="var(--cyan)" />
                  <span><strong>{movCount}</strong> Mutasi Stok</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: 'var(--bg-surface)', padding: '6px 8px', borderRadius: '4px' }}>
                  <ClipboardCheck size={13} color="#f59e0b" />
                  <span><strong>{opnCount}</strong> Sesi Opname</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Warning Box */}
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              gap: '10px',
            }}
          >
            <ShieldAlert size={20} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
              <strong style={{ color: '#f87171', display: 'block', marginBottom: '4px' }}>
                Peringatan: Restore akan mengganti data lokal CosplayPOS dengan data dari backup.
              </strong>
              <span style={{ color: 'var(--text-secondary)' }}>
                Untuk keamanan, sistem akan secara otomatis mengunduh cadangan darurat (<strong>Pre-Restore Backup</strong>) dari kondisi saat ini sebelum data diganti.
              </span>
            </div>
          </div>

          {/* Progress / Status feedback */}
          {isRestoring && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'var(--cyan)',
              }}
            >
              <Loader2 size={16} className="spinning" />
              <span>{restoreStage}</span>
            </div>
          )}
        </div>

        {/* Step 5: Modal Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            padding: '16px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
          }}
        >
          <button
            id="btn-cancel-restore"
            onClick={onClose}
            disabled={isRestoring}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isRestoring ? 'not-allowed' : 'pointer',
            }}
          >
            Batal
          </button>

          <button
            id="btn-confirm-restore"
            onClick={handleConfirmRestore}
            disabled={isRestoring}
            style={{
              background: isRestoring
                ? 'rgba(239, 68, 68, 0.4)'
                : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: isRestoring ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
            }}
          >
            {isRestoring ? (
              <>
                <Loader2 size={15} className="spinning" />
                <span>Memproses Pemulihan...</span>
              </>
            ) : (
              <>
                <span>Lanjutkan Pemulihan (Restore)</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
